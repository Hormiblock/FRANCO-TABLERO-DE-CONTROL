import NavBar from './NavBar'

interface AppShellProps {
  children: React.ReactNode
  title?: string
  headerRight?: React.ReactNode
}

export default function AppShell({ children, title, headerRight }: AppShellProps) {
  return (
    <div className="flex h-full min-h-screen">
      <NavBar />
      <div className="flex flex-col flex-1 min-w-0 pl-16 md:pl-48">
        {title && (
          <header className="sticky top-0 z-40 bg-[var(--primary)] text-white px-4 pt-safe-top">
            <div className="flex items-center justify-between h-14">
              <h1 className="text-lg font-semibold truncate">{title}</h1>
              {headerRight && <div>{headerRight}</div>}
            </div>
          </header>
        )}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
