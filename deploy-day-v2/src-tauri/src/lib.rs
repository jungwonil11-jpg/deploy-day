use tauri::{
    menu::{CheckMenuItemBuilder, MenuBuilder, MenuItemBuilder, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_store::StoreExt;

// 저장된 상태(deployday.json)에서 UI 언어를 읽어 트레이가 같은 언어로 뜨게 한다.
// (시작 시 1회 — 언어 토글 즉시반영은 안 하지만 lang 은 영속이라 다음 실행에 반영됨)
fn tray_is_en(app: &tauri::AppHandle) -> bool {
    app.store("deployday.json")
        .ok()
        .and_then(|s| s.get("state"))
        .and_then(|st| st.get("lang").and_then(|v| v.as_str()).map(|x| x == "en"))
        .unwrap_or(false)
}

fn show_main(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}

// 백업 파일 쓰기/읽기 — dialog 플러그인이 고른 절대경로를 그대로 std::fs 로 처리.
// (fs 플러그인 scope 설정을 피하고 임의 경로를 안전하게 다루기 위해 커스텀 커맨드 사용)
#[tauri::command]
fn save_text_file(path: String, contents: String) -> Result<(), String> {
    std::fs::write(&path, contents).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![save_text_file, read_text_file])
        .setup(|app| {
            let handle = app.handle();
            let autostart_on = handle.autolaunch().is_enabled().unwrap_or(false);

            // 트레이 언어 — 저장된 lang 따라 ko/en
            let is_en = tray_is_en(handle);
            let (l_open, l_memo, l_pin, l_auto, l_quit, l_tip, n_title, n_body) = if is_en {
                (
                    "Open",
                    "New note",
                    "Always on top",
                    "Run at Windows startup",
                    "Quit",
                    "deploy-day — ship every week",
                    "deploy-day",
                    "Still running in the tray. Click the tray icon to reopen.",
                )
            } else {
                (
                    "열기",
                    "새 메모",
                    "항상 위에 고정",
                    "윈도우 시작 시 실행",
                    "종료",
                    "deploy-day — 매주 배포일",
                    "deploy-day",
                    "트레이에서 계속 실행 중이에요. 트레이 아이콘을 누르면 다시 열려요.",
                )
            };

            // 트레이 메뉴
            let open_i = MenuItemBuilder::with_id("open", l_open).build(app)?;
            let memo_i = MenuItemBuilder::with_id("new_memo", l_memo).build(app)?;
            let pin_i = CheckMenuItemBuilder::with_id("pin", l_pin)
                .checked(false)
                .build(app)?;
            let auto_i = CheckMenuItemBuilder::with_id("autostart", l_auto)
                .checked(autostart_on)
                .build(app)?;
            let quit_i = MenuItemBuilder::with_id("quit", l_quit).build(app)?;
            let sep1 = PredefinedMenuItem::separator(app)?;
            let sep2 = PredefinedMenuItem::separator(app)?;
            let menu = MenuBuilder::new(app)
                .items(&[&open_i, &memo_i, &sep1, &pin_i, &auto_i, &sep2, &quit_i])
                .build()?;

            // pin 토글 상태를 클로저에서 공유
            let pin_state = std::sync::Arc::new(std::sync::atomic::AtomicBool::new(false));
            let pin_state_cl = pin_state.clone();
            let pin_item = pin_i.clone();

            TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip(l_tip)
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "open" => show_main(app),
                    "new_memo" => {
                        show_main(app);
                        let _ = app.emit("tray-new-memo", ());
                    }
                    "pin" => {
                        use std::sync::atomic::Ordering;
                        let next = !pin_state_cl.load(Ordering::Relaxed);
                        pin_state_cl.store(next, Ordering::Relaxed);
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.set_always_on_top(next);
                        }
                        let _ = pin_item.set_checked(next);
                    }
                    "autostart" => {
                        let mgr = app.autolaunch();
                        let on = mgr.is_enabled().unwrap_or(false);
                        if on {
                            let _ = mgr.disable();
                        } else {
                            let _ = mgr.enable();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    // 트레이 좌클릭 → 창 열기
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main(tray.app_handle());
                    }
                })
                .build(app)?;

            // 메인 창 X → 종료 대신 트레이로 숨김 + 최초 1회 "트레이 상주" 알림
            if let Some(main) = app.get_webview_window("main") {
                let main_cl = main.clone();
                let notify_handle = handle.clone();
                let notified = std::sync::Arc::new(std::sync::atomic::AtomicBool::new(false));
                main.on_window_event(move |e| {
                    if let WindowEvent::CloseRequested { api, .. } = e {
                        api.prevent_close();
                        let _ = main_cl.hide();
                        use std::sync::atomic::Ordering;
                        if !notified.swap(true, Ordering::Relaxed) {
                            let _ = notify_handle
                                .notification()
                                .builder()
                                .title(n_title)
                                .body(n_body)
                                .show();
                        }
                    }
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
