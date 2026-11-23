import { Button, Col, Form, Input, InputNumber, Modal, Row, Switch } from 'antd'
import type { Product, ProductValues } from './product'

interface ProductFormProps {
  onSave: (values: ProductValues) => void
  onCancel: () => void
  product?: Product
  barcode?: string
}

export function ProductForm({ onSave, onCancel, product, barcode = '' }: ProductFormProps) {
  return (
    <Modal open centered width={660} title={product ? 'Editar producto' : 'Agregar producto'} onCancel={onCancel} footer={null} mask={{ closable: false }}>
      <Form<ProductValues> layout="vertical" onFinish={onSave} initialValues={product ?? { price: 0, stock: 0, active: true, barcode }} requiredMark="optional" scrollToFirstError>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="name" label="Nombre del producto" rules={[{ required: true, whitespace: true, message: 'Escribe el nombre del producto.' }]}>
              <Input placeholder="Ej. Agua purificada 1 L" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="barcode" label="Código de barras" rules={[{ pattern: /^\d{8,14}$/, message: 'Usa de 8 a 14 dígitos.' }]}>
              <Input inputMode="numeric" placeholder="Ej. 7501000000001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="price" label="Precio de venta" rules={[{ required: true, type: 'number', min: 0, message: 'Ingresa un precio igual o mayor a 0.' }]}>
              <InputNumber prefix="$" suffix="MXN" min={0} precision={2} className="full-width" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="stock" label={product ? 'Existencias' : 'Existencias iniciales'} rules={[{ required: true, type: 'integer', min: 0, message: 'Ingresa un número entero igual o mayor a 0.' }]}>
              <InputNumber min={0} disabled={!!product} className="full-width" />
            </Form.Item>
          </Col>
        </Row>
        {product && <p className="muted form-note">Para cambiar existencias, registra una entrada o un ajuste en Movimientos.</p>}
        <Form.Item name="description" label="Descripción">
          <Input.TextArea rows={2} placeholder="Presentación, marca o detalles del producto" />
        </Form.Item>
        <div className="status-field"><div><strong>Producto activo</strong><p>Disponible para registrar ventas.</p></div><Form.Item name="active" valuePropName="checked" noStyle><Switch aria-label="Producto activo" /></Form.Item></div>
        <div className="form-footer modal-actions"><Button onClick={onCancel}>Cancelar</Button><Button type="primary" className="action-tone action-save" htmlType="submit">{product ? 'Guardar cambios' : 'Agregar producto'}</Button></div>
      </Form>
    </Modal>
  )
}
