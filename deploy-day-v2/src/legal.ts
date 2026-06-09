// 설정 화면 문서 — 스토어 심사 대비. v1 legal.dart 포팅. 언어별(ko/en) 제공.
import type { Lang } from './types';

const kManualKo = `1. 프로젝트 만들기
/sprint 의 [+ 프로젝트]로 진행 중인 일(공부, 운동, 사이드 프로젝트 등)을 등록합니다.

2. 커밋 쌓기
이번 주에 할 일을 ❯ 입력줄로 추가합니다. 프로젝트 칩을 선택한 상태로 추가하면 그 프로젝트로 분류됩니다.

3. 체크하기
끝낸 일은 ☐ 를 눌러 완료 처리합니다. 완료한 일은 그룹 맨 아래로 내려갑니다.

4. 배포일에 ship
배포 요일(기본 목요일)이 되면 ship 버튼이 켜집니다. 완료한 일은 릴리즈노트로 박제되고, 못한 일은 rollback 표시와 함께 다음 주로 넘어갑니다.

5. streak 지키기
한 건이라도 완료하고 배포하면 streak이 1주 쌓입니다. 빈손으로 배포하면 streak이 끊깁니다.

팁
·  항목 텍스트를 누르면 수정
·  배너의 "매주 ○요일"을 누르면 배포 요일 변경
·  /backlog 는 다음에 할 일 보관함 — pull 로 스프린트에 가져옵니다
·  /memo 는 바탕화면 포스트잇 — 끌어서 옮기면 화면 가장자리·다른 메모에 자석처럼 붙습니다
·  데이터는 기기에만 저장됩니다 — export 로 직접 백업하세요`;

const kManualEn = `1. Create a project
In /sprint, use [+ project] to register something you're working on (study, workout, side project, etc.).

2. Stack commits
Add this week's tasks via the ❯ input line. Adding while a project chip is selected files the task under that project.

3. Check things off
Tap ☐ to complete a finished task. Completed tasks move to the bottom of the group.

4. Ship on ship day
The ship button turns on when ship day arrives (Thursday by default). Done items are frozen into the release notes; unfinished ones carry over to next week with a rollback tag.

5. Keep your streak
Ship with at least one item done and your streak gains a week. Ship empty-handed and the streak breaks.

Tips
·  Tap an item's text to edit it
·  Tap "every ___day" on the banner to change ship day
·  /backlog is a stash for later tasks — pull them into the sprint
·  /memo is a desktop sticky note — drag it to snap to screen edges & other notes
·  Data is stored only on your device — back it up yourself with export`;

const kAboutKo = `deploy-day는 인생을 소프트웨어처럼 배포하는 todo 앱입니다.

·  일주일이 하나의 스프린트입니다
·  할 일은 커밋처럼 쌓습니다
·  정해진 요일(기본 목요일)에 한 주를 ship 합니다
·  완료한 일은 릴리즈노트에 박제되고,
   못한 일은 다음 스프린트로 롤백됩니다
·  연속 배포 주수가 streak으로 쌓입니다

핵심 철학: 완벽한 계획보다 주기적인 배포.
거창한 결심 대신 매주 작게라도 버전을 올리는 것.
v1.0의 인생도 매주 0.1씩 오릅니다.

UI는 Claude Code CLI에 대한 오마주입니다.`;

const kAboutEn = `deploy-day is a todo app that ships your life like software.

·  One week is one sprint
·  Tasks stack up like commits
·  You ship the week on a set day (Thursday by default)
·  Done items are frozen into the release notes,
   unfinished ones roll over to the next sprint
·  Consecutive ship weeks accumulate as a streak

Core philosophy: periodic shipping over a perfect plan.
Instead of grand resolutions, bump your version a little every week.
A v1.0 life goes up 0.1 each week too.

The UI is an homage to the Claude Code CLI.`;

const kPrivacyKo = `시행일: 2026-06-08

1. 개요
deploy-day(이하 "앱")는 사용자의 개인정보를 수집·전송·판매하지 않는 것을 원칙으로 합니다.

2. 수집하는 정보
앱은 어떤 개인정보도 서버로 수집하지 않습니다. 사용자가 입력하는 모든 데이터(이름, 할 일, 백로그, 릴리즈 기록, 메모, 설정값)는 사용 중인 기기의 로컬 저장소에만 저장됩니다.

3. 네트워크 통신
앱은 어떤 네트워크 통신도 수행하지 않습니다. 자체 서버를 운영하지 않으며, 모든 리소스가 앱에 내장되어 있어 인터넷 연결 없이 완전하게 동작합니다.

4. 제3자 제공 및 광고
개인정보의 제3자 제공이 없습니다. 광고 SDK, 분석(애널리틱스) 도구, 추적 기술을 사용하지 않습니다.

5. 데이터 보관 및 삭제
모든 데이터는 앱 삭제 시 함께 삭제됩니다. 앱 내 reset 기능으로도 전체 초기화할 수 있습니다. 내보내기(export)로 생성한 백업 데이터의 보관 책임은 사용자에게 있습니다.

6. 아동의 개인정보
앱은 개인정보를 수집하지 않으므로 아동의 개인정보 또한 수집하지 않습니다.

7. 문의
개인정보 관련 문의: jungwonil11@gmail.com

8. 변경 고지
본 방침이 변경되는 경우 앱 업데이트 노트(릴리즈 노트)를 통해 고지합니다.`;

const kPrivacyEn = `Effective date: 2026-06-08

1. Overview
deploy-day (the "app") is built on the principle of not collecting, transmitting, or selling your personal information.

2. Information collected
The app collects no personal information to any server. All data you enter (name, tasks, backlog, release history, notes, settings) is stored only in your device's local storage.

3. Network communication
The app performs no network communication. It runs no server of its own, and all resources are bundled into the app, so it works fully without an internet connection.

4. Third parties and ads
There is no provision of personal information to third parties. No ad SDKs, analytics tools, or tracking technologies are used.

5. Data retention and deletion
All data is deleted when the app is uninstalled. You can also wipe everything with the in-app reset feature. You are responsible for keeping any backup created via export.

6. Children's privacy
Because the app collects no personal information, it does not collect children's personal information either.

7. Contact
Privacy inquiries: jungwonil11@gmail.com

8. Changes
If this policy changes, it will be announced through the app's update notes (release notes).`;

const kTermsKo = `시행일: 2026-06-08

1. 목적
본 약관은 deploy-day(이하 "앱")의 이용 조건을 규정합니다. 앱을 설치·사용하면 본 약관에 동의한 것으로 봅니다.

2. 서비스 성격
앱은 무료로 제공되는 개인 생산성 도구입니다. 계정 가입·로그인·서버 연동 없이 동작합니다.

3. 데이터 책임
모든 데이터는 기기에만 저장됩니다. 기기 분실·고장·앱 삭제로 인한 데이터 손실은 복구할 수 없으므로, 중요한 데이터는 내보내기(export) 기능으로 직접 백업하시기 바랍니다.

4. 이용 제한
관련 법령에 위반되는 방식으로 앱을 이용할 수 없습니다.

5. 면책
앱은 "있는 그대로(AS IS)" 제공됩니다. 제작자는 앱 사용 또는 사용 불능으로 인한 직접·간접 손해에 대해 관련 법령이 허용하는 최대 범위 내에서 책임을 지지 않습니다.

6. 약관 변경
약관이 변경되는 경우 앱 업데이트 노트(릴리즈 노트)를 통해 고지합니다.

7. 문의
jungwonil11@gmail.com`;

const kTermsEn = `Effective date: 2026-06-08

1. Purpose
These terms govern the conditions of using deploy-day (the "app"). Installing or using the app constitutes agreement to these terms.

2. Nature of the service
The app is a free personal productivity tool. It works without account signup, login, or server integration.

3. Data responsibility
All data is stored only on your device. Data loss from a lost or broken device or app deletion cannot be recovered, so please back up important data yourself with the export feature.

4. Use restrictions
You may not use the app in any way that violates applicable law.

5. Disclaimer
The app is provided "AS IS." To the maximum extent permitted by applicable law, the maker is not liable for any direct or indirect damages arising from use or inability to use the app.

6. Changes to terms
If the terms change, it will be announced through the app's update notes (release notes).

7. Contact
jungwonil11@gmail.com`;

export const kManual: Record<Lang, string> = { ko: kManualKo, en: kManualEn };
export const kAbout: Record<Lang, string> = { ko: kAboutKo, en: kAboutEn };
export const kPrivacyPolicy: Record<Lang, string> = { ko: kPrivacyKo, en: kPrivacyEn };
export const kTerms: Record<Lang, string> = { ko: kTermsKo, en: kTermsEn };
