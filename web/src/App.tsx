import { NavLink, Outlet } from 'react-router'

const TABS = [
  { to: '/', label: 'Vagas', end: true },
  { to: '/matches', label: 'Matches' },
  { to: '/perfil', label: 'Perfil' },
  { to: '/digest', label: 'Digest' },
]

export function App() {
  return (
    <>
      <header className="topbar">
        <h1>🔎 Busca Vagas</h1>
        <nav className="tabs">
          {TABS.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.end} className="tab">
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  )
}
