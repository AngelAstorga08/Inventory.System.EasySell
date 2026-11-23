import { useFeedback } from '../../shared/useFeedback'
import { useState } from 'react'
import { Alert, Button, Col, Form, Input, Modal, Row, Select, Switch, Table } from 'antd'
import type { TableColumnsType } from 'antd'
import type { User, UserValues } from '../../data/inventory-model'
import type { InventoryController } from '../../data/useInventory'
import { normalize } from '../../shared/format'
import { NoResults, PageHeading, SearchField, StateFilter, StatusText } from '../../shared/ui'

export function UsersPage({ store }: { store: InventoryController }) {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const feedback = useFeedback()
  function closeForm() { setCreating(false); setEditing(null) }
  const rows = store.state.users.filter(user => normalize(`${user.name} ${user.email} ${user.role}`).includes(normalize(query)) && (status === 'all' || user.active === (status === 'active')))
  const columns: TableColumnsType<User> = [
    { title: 'NOMBRE', dataIndex: 'name', render: (name: string) => <strong>{name}</strong> }, { title: 'CORREO', dataIndex: 'email' },
    { title: 'ROL', dataIndex: 'role', render: (role: string) => <span className="soft-label">{role}</span> },
    { title: 'ESTADO', dataIndex: 'active', render: (active: boolean) => <StatusText active={active} /> },
    { title: 'ACCIONES', key: 'actions', render: (_: unknown, user: User) => <div className="inline-actions"><Button type="link" onClick={() => { setCreating(false); setEditing(user) }}>Editar</Button><Button type="text" danger={user.active} className={user.active ? undefined : "action-tone action-save action-outline"} disabled={user.id === store.user?.id} onClick={() => feedback(() => store.run({ type: 'toggleUser', id: user.id }), user.active ? 'Usuario desactivado.' : 'Usuario activado.')}>{user.active ? 'Desactivar' : 'Activar'}</Button></div> },
  ]
  return <>
    <PageHeading title="Usuarios y roles" subtitle="Administra quién puede operar en tu negocio." />
    <Modal open={creating || !!editing} centered width={640} title={editing ? 'Editar usuario' : 'Agregar usuario'} onCancel={closeForm} footer={null} mask={{ closable: false }} destroyOnHidden>
      <Form<UserValues> key={editing?.id ?? 'new'} layout="vertical" initialValues={editing ?? { active: true, role: 'Vendedor' }} onFinish={(values: UserValues) => feedback(() => { store.run({ type: 'saveUser', id: editing?.id, values }); closeForm() }, 'Usuario guardado.')}>
        <Row gutter={20}><Col xs={24} md={12}><Form.Item label="Nombre" name="name" rules={[{ required: true, whitespace: true, message: 'Escribe el nombre.' }]}><Input placeholder="Nombre y apellidos" /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Correo electrónico" name="email" rules={[{ required: true, type: 'email', message: 'Escribe un correo válido.' }]}><Input type="email" placeholder="nombre@negocio.com" /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Rol" name="role" rules={[{ required: true }]}><Select disabled={editing?.id === store.user?.id} options={[{ value: 'Administrador', label: 'Administrador' }, { value: 'Vendedor', label: 'Vendedor' }]} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Usuario activo" name="active" valuePropName="checked"><Switch disabled={editing?.id === store.user?.id} /></Form.Item></Col></Row>
        <p className="muted small-copy">El correo es único para cada usuario.</p>
        <div className="form-footer modal-actions"><Button onClick={closeForm}>Cancelar</Button><Button type="primary" className="action-tone action-save" htmlType="submit">Guardar</Button></div>
      </Form>
    </Modal>
    <div className="module-toolbar"><Button type="primary" disabled={creating} onClick={() => { setEditing(null); setCreating(true) }}>Agregar usuario</Button><SearchField value={query} onChange={setQuery} placeholder="Buscar nombre, correo o rol…" /><StateFilter value={status} onChange={setStatus} /></div>
    <div className="table-container"><Table<User> rowKey="id" dataSource={rows} columns={columns} scroll={{ x: 850 }} locale={{ emptyText: <NoResults /> }} pagination={{ pageSize: 8, showSizeChanger: false }} /></div>
    <div className="role-cards"><article className="panel"><h3>Administrador</h3><p>Gestiona productos, entradas, ajustes, discrepancias y usuarios. También registra y consulta ventas.</p></article><article className="panel"><h3>Vendedor</h3><p>Consulta productos, registra ventas y revisa movimientos, discrepancias y reportes. Las acciones de administración están restringidas.</p></article></div>
    <Alert type="info" title="Roles simulados en el navegador" description="El selector de la esquina superior derecha permite probar cada usuario activo. La autenticación y autorización del servidor se integrarán con la API." showIcon />
  </>
}
