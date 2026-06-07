use tauri::{
    menu::{CheckMenuItemBuilder, MenuBuilder, MenuItemBuilder, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};

fn show_main(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .setup(|app| {
            let handle = app.handle();
            let autostart_on = handle.autolaunch().is_enabled().unwrap_or(false);

            // 트레이 메뉴
            let open_i = MenuItemBuilder::with_id("open", "열기").build(app)?;
            let memo_i = MenuItemBuilder::with_id("new_memo", "새 메모").build(app)?;
            let pin_i = CheckMenuItemBuilder::with_id("pin", "항상 위에 고정")
                .checked(false)
                .build(app)?;
            let auto_i = CheckMenuItemBuilder::with_id("autostart", "윈도우 시작 시 실행")
                .checked(autostart_on)
                .build(app)?;
            let quit_i = MenuItemBuilder::with_id("quit", "종료").build(app)?;
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
                .tooltip("deploy-day — 매주 배포일")
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

            // 메인 창 X → 종료 대신 트레이로 숨김
            if let Some(main) = app.get_webview_window("main") {
                let main_cl = main.clone();
                main.on_window_event(move |e| {
                    if let WindowEvent::CloseRequested { api, .. } = e {
                        api.prevent_close();
                        let _ = main_cl.hide();
                    }
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
