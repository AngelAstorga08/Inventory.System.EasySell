import { useEffect, useState } from 'react'
import { Alert, Avatar, Button, Drawer, Dropdown, Menu, Modal, Select } from 'antd'
import { AppstoreOutlined, BarChartOutlined, HomeOutlined, MenuOutlined, ShoppingCartOutlined, SwapOutlined, TeamOutlined, WalletOutlined, WarningOutlined } from '@ant-design/icons'
import { useInventory } from './data/useInventory'
import { ProductsPage } from './features/products/ProductsPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { SalesPage } from './features/sales/SalesPage'
import { CashPage } from './features/cash/CashPage'
import { MovementsPage } from './features/movements/MovementsPage'
import { DiscrepanciesPage } from './features/discrepancies/DiscrepanciesPage'
import { ReportsPage } from './features/reports/ReportsPage'
import { UsersPage } from './features/users/UsersPage'

const modules = [
  { key: 'inicio', label: 'Inicio', icon: <HomeOutlined /> },
  { key: 'productos', label: 'Productos', icon: <AppstoreOutlined /> },
  { key: 'ventas', label: 'Ventas', icon: <ShoppingCartOutlined /> },
  { key: 'caja', label: 'Caja', icon: <WalletOutlined /> },
  { key: 'movimientos', label: 'Movimientos', icon: <SwapOutlined /> },
  { key: 'discrepancias', label: 'Discrepancias', icon: <WarningOutlined /> },
  { key: 'reportes', label: 'Reportes', icon: <BarChartOutlined /> },
  { key: 'usuarios', label: 'Usuarios y roles', icon: <TeamOutlined /> },
]
const currentRoute = () => location.hash.slice(1) || 'productos'

export function InventoryApp() {
  const store = useInventory()
  const [route, setRoute] = useState(currentRoute)
  const [navigationOpen, setNavigationOpen] = useState(false)
  const [loginUser, setLoginUser] = useState(1)
  useEffect(() => {
    const update = () => setRoute(currentRoute())
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  function navigate(key: string) { location.hash = key; setRoute(key); setNavigationOpen(false); window.scrollTo({ top: 0 }) }
  const available = modules.filter(module => module.key !== 'usuarios' || store.isAdmin)
  const activeRoute = available.some(module => module.key === route) ? route : 'inicio'
  const menu = <Menu className="navigation-menu" mode="inline" selectedKeys={[activeRoute]} items={available} onClick={({ key }: { key: string }) => navigate(key)} />

  if (!store.user) return <div className="login-shell"><Modal open centered width={440} title="Bienvenido de nuevo"
    closable={false} keyboard={false} mask={{ closable: false }} footer={null}>
    <div className="brand"><span className="brand-icon"><AppstoreOutlined /></span><span>Inventory<span className="brand-light">System</span></span></div>
    <p className="muted">Selecciona un usuario para explorar tu inventario.</p>
    <Alert type="info" title="Acceso de demostración" description="Esta selección simula los roles. No es autenticación real." showIcon />
    <label htmlFor="login-user" className="field-label">Usuario</label><Select id="login-user" className="full-width" value={loginUser} onChange={(value: number) => setLoginUser(value)} options={store.state.users.filter(user => user.active).map(user => ({ value: user.id, label: `${user.name} · ${user.role}` }))} />
    <Button block type="primary" className="spaced-form" onClick={() => store.selectUser(loginUser)}>Entrar a la demostración</Button>
  </Modal></div>

  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="#inicio"><span className="brand-icon"><AppstoreOutlined /></span><span>Easy<span className="brand-light">Sell</span></span></a><div className="sidebar-caption">MI NEGOCIO</div>{menu}<div className="sidebar-note"><span className="demo-dot" /> Datos de demostración<p>Tu inventario, siempre a mano.</p></div></aside>
    <div className="workspace">
      <header className="workspace-header"><div className="workspace-title"><Button className="mobile-menu-button" aria-label="Abrir menú" icon={<MenuOutlined />} onClick={() => setNavigationOpen(true)} /><span>Mi negocio <span className="header-divider">/</span> <strong>{available.find(module => module.key === activeRoute)?.label}</strong></span></div>
        <Dropdown trigger={['click']} menu={{ items: [
          ...store.state.users.filter(user => user.active).map(user => ({ key: String(user.id), label: `${user.name} · ${user.role}`, onClick: () => store.selectUser(user.id) })),
          { type: 'divider' as const }, { key: 'logout', label: 'Salir de la demostración', onClick: () => store.selectUser(null) },
        ] }}><Button type="text" className="profile-button"><Avatar size={32} style={{ background: '#edf2ff', color: '#2452d6' }}>{store.user.name.charAt(0)}</Avatar><span className="profile-copy">{store.user.name}<small>{store.user.role}</small></span></Button></Dropdown>
      </header>
      <main className="main-content">
        {store.storageWarning && <Alert className="storage-alert" type="warning" title={store.storageWarning} showIcon />}
        {activeRoute === 'inicio' && <DashboardPage store={store} navigate={navigate} />}
        {activeRoute === 'productos' && <ProductsPage store={store} />}
        {activeRoute === 'ventas' && <SalesPage store={store} onOpenCash={() => navigate('caja')} />}
        {activeRoute === 'caja' && <CashPage store={store} onSell={() => navigate('ventas')} />}
        {activeRoute === 'movimientos' && <MovementsPage store={store} />}
        {activeRoute === 'discrepancias' && <DiscrepanciesPage store={store} />}
        {activeRoute === 'reportes' && <ReportsPage store={store} />}
        {activeRoute === 'usuarios' && <UsersPage store={store} />}
        <footer className="page-footer"><span><span className="demo-dot" /> Demostración interactiva</span><span>Datos guardados en este navegador · Sin conexión al servidor</span></footer>
      </main>
    </div>
    <Drawer title="EasySell" placement="left" open={navigationOpen} onClose={() => setNavigationOpen(false)}>{menu}</Drawer>
    <nav className="mobile-bottom-nav" aria-label="Navegación principal">{available.slice(0, 3).map(module => <a key={module.key} href={`#${module.key}`} aria-current={activeRoute === module.key ? 'page' : undefined}>{module.icon}<span>{module.label}</span></a>)}<button onClick={() => setNavigationOpen(true)}><MenuOutlined /><span>Más</span></button></nav>
  </div>
}
