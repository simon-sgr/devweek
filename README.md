# DevWeek

DevWeek is a Tauri desktop task planner built with React, TypeScript, and Vite. It combines a weekly calendar, a kanban board, and statistics in one workspace so you can move tasks around quickly and keep an eye on progress.

## Features

- Weekly calendar view for date-based planning.
- Kanban board with Inbox, Ready, and On Hold lanes.
- Drag and drop between the calendar and board.
- Task editing with priority, completion, notes, and dates.
- Statistics dashboard with completion, priority, and workflow breakdowns.
- Light, dark, and system theme support.
- Automatic overdue-task migration once per day when enabled.
- JSON import and export for task data.
- Native desktop window controls and custom title bar.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tauri v2
- dnd-kit
- Recharts
- lucide-react

## Getting Started

### Prerequisites

- Node.js 18 or newer
- Rust toolchain
- Tauri CLI dependencies installed through npm

### Install dependencies

```bash
npm install
```

### Run in development

```bash
npm run tauri dev
```

### Build the web app

```bash
npm run build
```

### Build the desktop app

```bash
npm run tauri build
```

## Available Scripts

- `npm run dev` - start the Vite dev server.
- `npm run build` - type-check and build the frontend.
- `npm run preview` - preview the production build.
- `npm run tauri` - run the Tauri CLI.

## How It Stores Data

DevWeek stores data locally on your machine:

- `tasks.json` for task data.
- `settings.json` for app settings such as theme and task automation.

Both files are managed through the Tauri store plugin.

## Main Views

- Board - calendar and kanban task management.
- Statistics - visual summaries of your task data.
- Settings - theme, automation, import/export, and data reset.

## Project Structure

- `src/App.tsx` - main app shell and desktop window controls.
- `src/TaskBoard.tsx` - task loading, drag and drop, and persistence.
- `src/components/calendar/Calendar.tsx` and `src/components/board/Kanban.tsx` - calendar and kanban views.
- `src/components/task/` - task cards, add/edit forms, and modal UI.
- `src/Statistic.tsx` - statistics dashboard.
- `src/Setting.tsx` - settings page.
- `src/lib/TaskStore.ts` - task persistence and migration logic.
- `src/lib/SettingStore.ts` - settings persistence.
- `src-tauri/` - Tauri backend and configuration.

## Notes

- The app uses a custom title bar and undecorated desktop window.
- Dragging tasks works across the calendar and kanban board.
- Task automation only moves overdue open tasks and leaves completed tasks in place.

## License

No license file is currently included.
