import { useRef, useState } from 'react'
import { Alert, Button, Form, Input, Modal, Select } from 'antd'
import { BarcodeOutlined } from '@ant-design/icons'
import type { Product } from '../features/products/product'

export function BarcodeScanner({ products, onScan, label = 'Escanear código', disabled }: {
  products?: Product[]
  onScan: (code: string) => void
  label?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const samples = products?.filter(product => product.barcode)
  const [sample, setSample] = useState<string>()
  const pendingCode = useRef<string | null>(null)

  function scan(code: string) {
    pendingCode.current = code.trim()
    setOpen(false)
  }

  function finishScan() {
    const code = pendingCode.current
    pendingCode.current = null
    if (code) onScan(code)
  }

  return <>
    <Button className="action-tone action-scan action-outline" icon={<BarcodeOutlined />} disabled={disabled} onClick={() => setOpen(true)}>{label}</Button>
    <Modal centered title="Escáner de código de barras" open={open} onCancel={() => setOpen(false)} afterClose={finishScan} footer={null} destroyOnHidden>
      <Alert type="info" showIcon title="Simulación sin cámara" />
      {!!samples?.length && <>
        <label className="field-label" htmlFor="barcode-sample">Producto de ejemplo</label>
        <div className="scanner-samples">
          <Select id="barcode-sample" placeholder="Selecciona un producto" value={sample} onChange={setSample} options={samples.flatMap(product => product.barcode ? [{ value: product.barcode, label: product.name }] : [])} />
          <Button className="action-tone action-scan action-outline" disabled={!sample} onClick={() => sample && scan(sample)}>Simular lectura</Button>
        </div>
      </>}
      <Form className="spaced-form" layout="vertical" onFinish={(values: { code: string }) => scan(values.code)}>
        <Form.Item label="Código de barras" name="code" rules={[{ required: true, message: 'Escribe un código.' }, { pattern: /^\d{8,14}$/, message: 'Usa de 8 a 14 dígitos.' }]}><Input inputMode="numeric" placeholder="Ej. 7501000000001" /></Form.Item>
        <div className="form-footer modal-actions"><Button onClick={() => setOpen(false)}>Cancelar</Button><Button type="primary" className="action-tone action-scan" htmlType="submit">Leer código</Button></div>
      </Form>
    </Modal>
  </>
}
