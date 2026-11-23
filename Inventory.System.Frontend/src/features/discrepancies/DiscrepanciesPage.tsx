import { useFeedback } from "../../shared/useFeedback";
import { useState } from "react";
import {
  Alert,
  Button,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Table,
} from "antd";
import type { TableColumnsType } from "antd";
import type { Discrepancy } from "../../data/inventory-model";
import type { InventoryController } from "../../data/useInventory";
import { dateTime, normalize } from "../../shared/format";
import { NoResults, PageHeading, SearchField } from "../../shared/ui";

interface CountValues {
  productId: number;
  counted: number;
  reason: string;
}
interface ResolutionValues {
  counted: number;
  resolution: string;
}

export function DiscrepanciesPage({ store }: { store: InventoryController }) {
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("pending");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [seed, setSeed] = useState<{ key: number; values?: CountValues }>({
    key: 0,
  });
  const feedback = useFeedback();
  const detail = store.state.discrepancies.find((item) => item.id === detailId);
  const currentProduct = store.state.products.find(
    (item) => item.id === detail?.productId,
  );
  const pending = store.state.discrepancies.filter(
    (item) => !item.resolved,
  ).length;
  const rows = store.state.discrepancies.filter(
    (item) =>
      normalize(`${item.productName} ${item.reason}`).includes(
        normalize(query),
      ) &&
      (status === "all" || item.resolved === (status === "resolved")),
  );
  const columns: TableColumnsType<Discrepancy> = [
    { title: "PRODUCTO", dataIndex: "productName", width: 250 },
    {
      title: "FECHA DEL CONTEO",
      dataIndex: "date",
      width: 190,
      render: dateTime,
    },
    { title: "EN SISTEMA", dataIndex: "expected", align: "center", width: 120 },
    {
      title: "CONTEO FÍSICO",
      dataIndex: "counted",
      align: "center",
      width: 140,
    },
    {
      title: "DIFERENCIA",
      key: "difference",
      align: "center",
      width: 120,
      render: (_: unknown, item: Discrepancy) => (
        <span
          className={item.counted < item.expected ? "negative" : "positive"}
        >
          {item.counted - item.expected > 0 ? "+" : ""}
          {item.counted - item.expected}
        </span>
      ),
    },
    {
      title: "ESTADO",
      dataIndex: "resolved",
      width: 130,
      render: (resolved: boolean) => (
        <span className={resolved ? "product-status active" : "out-of-stock"}>
          {resolved ? "Resuelta" : "Pendiente"}
        </span>
      ),
    },
    {
      title: "ACCIONES",
      key: "actions",
      width: 130,
      render: (_: unknown, item: Discrepancy) => (
        <Button type="link" onClick={() => setDetailId(item.id)}>
          {item.resolved || !store.isAdmin ? "Ver detalle" : "Resolver"}
        </Button>
      ),
    },
  ];

  function closeCount() {
    setSeed({ key: 0 });
    setCreating(false);
  }

  function simulate() {
    const product = store.state.products.find(
      (item) =>
        item.active &&
        item.stock > 0 &&
        !store.state.discrepancies.some(
          (d) => d.productId === item.id && !d.resolved,
        ),
    );
    if (!product)
      return feedback(() => {
        throw new Error(
          "No hay productos disponibles para simular una nueva diferencia.",
        );
      });
    setSeed((current) => ({
      key: current.key + 1,
      values: {
        productId: product.id,
        counted: Math.max(0, product.stock - 1),
        reason: "Diferencia de una unidad detectada en conteo simulado.",
      },
    }));
  }

  return (
    <>
      <PageHeading
        title="Discrepancias"
        subtitle="Compara las existencias registradas con el conteo físico."
        extra={<span className="soft-label amber">{pending} pendientes</span>}
      />
      <Modal open={creating && store.isAdmin} centered width={660}
        title="Registrar conteo" onCancel={closeCount} footer={null}
        mask={{ closable: false }} destroyOnHidden>
          <Alert
            type="info"
            title="El conteo no cambia las existencias hasta resolver la discrepancia."
            showIcon
          />
          <Form<CountValues>
            key={seed.key}
            initialValues={seed.values}
            layout="vertical"
            className="spaced-form"
            onFinish={(values: CountValues) =>
              feedback(() => {
                store.run({ type: "discrepancy", ...values });
                closeCount();
                setStatus("pending");
              }, "Discrepancia registrada.")
            }
          >
            <Row gutter={20}>
              <Col xs={24} md={16}>
                <Form.Item
                  label="Producto"
                  name="productId"
                  rules={[
                    { required: true, message: "Selecciona un producto." },
                  ]}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="Selecciona un producto activo"
                    options={store.state.products
                      .filter((item) => item.active)
                      .map((item) => ({
                        value: item.id,
                        label: `${item.name} · ${item.stock} en sistema`,
                      }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Conteo físico"
                  name="counted"
                  rules={[
                    {
                      required: true,
                      type: "integer",
                      min: 0,
                      message: "Ingresa un entero igual o mayor a cero.",
                    },
                  ]}
                >
                  <InputNumber min={0} className="full-width" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              label="Observación"
              name="reason"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: "Explica la diferencia.",
                },
              ]}
            >
              <Input.TextArea
                rows={2}
                placeholder="Describe dónde detectaste la diferencia"
              />
            </Form.Item>
            <div className="form-footer modal-actions">
              <Button onClick={simulate}>Simular diferencia</Button>
              <Button onClick={closeCount}>Cancelar</Button>
              <Button type="primary" className="action-tone action-save" htmlType="submit">
                Guardar
              </Button>
            </div>
          </Form>
      </Modal>
      <div className="module-toolbar">
        {store.isAdmin && (
          <Button
            type="primary"
            disabled={creating}
            onClick={() => setCreating(true)}
          >
            Registrar conteo
          </Button>
        )}
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Buscar producto u observación…"
        />
        <Select
          aria-label="Estado de discrepancia"
          value={status}
          onChange={(value: string) => setStatus(value)}
          options={[
            { value: "pending", label: "Pendientes" },
            { value: "resolved", label: "Resueltas" },
            { value: "all", label: "Todas" },
          ]}
        />
      </div>
      <div className="table-container">
        <Table<Discrepancy>
          rowKey="id"
          dataSource={rows}
          columns={columns}
          scroll={{ x: 1040 }}
          locale={{ emptyText: <NoResults /> }}
          pagination={{ pageSize: 8, showSizeChanger: false }}
        />
      </div>
      <Modal
        centered
        width={680}
        footer={null}
        mask={{ closable: false }}
        title={
          detail?.resolved ? "Discrepancia resuelta" : store.isAdmin ? "Resolver discrepancia" : "Detalle de discrepancia"
        }
        open={!!detail}
        onCancel={() => setDetailId(null)}
      >
        {detail && (
          <>
            <Descriptions
              column={1}
              items={[
                {
                  key: "product",
                  label: "Producto",
                  children: detail.productName,
                },
                {
                  key: "date",
                  label: "Fecha",
                  children: dateTime(detail.date),
                },
                {
                  key: "expected",
                  label: "Existencias al detectar",
                  children: detail.expected,
                },
                {
                  key: "counted",
                  label: "Conteo registrado",
                  children: detail.counted,
                },
                {
                  key: "current",
                  label: "Existencias actuales",
                  children: currentProduct?.stock,
                },
                {
                  key: "reason",
                  label: "Observación",
                  children: detail.reason,
                },
                ...(detail.resolved
                  ? [
                      {
                        key: "resolution",
                        label: "Resolución",
                        children: detail.resolution,
                      },
                      {
                        key: "resolvedStock",
                        label: "Conteo confirmado al resolver",
                        children: detail.resolvedStock,
                      },
                      {
                        key: "resolvedAt",
                        label: "Resuelta el",
                        children: detail.resolvedAt
                          ? dateTime(detail.resolvedAt)
                          : "—",
                      },
                    ]
                  : []),
              ]}
            />
            {!detail.resolved && store.isAdmin && (
              <Form<ResolutionValues>
                key={detail.id}
                layout="vertical"
                className="spaced-form"
                initialValues={{ counted: detail.counted }}
                onFinish={(values: ResolutionValues) =>
                  feedback(() => {
                    store.run({ type: "resolve", id: detail.id, ...values });
                    setDetailId(null);
                  }, "Discrepancia resuelta. Se registró un ajuste de inventario.")
                }
              >
                <Alert
                  type="warning"
                  title="Confirma el conteo físico actual"
                  description="Las existencias pueden haber cambiado desde la detección. El ajuste usará las existencias actuales y el conteo que confirmes aquí."
                  showIcon
                />
                <Form.Item
                  className="spaced-form"
                  label="Conteo físico confirmado"
                  name="counted"
                  rules={[
                    {
                      required: true,
                      type: "integer",
                      min: 0,
                      message: "Ingresa un conteo válido.",
                    },
                  ]}
                >
                  <InputNumber min={0} className="full-width" />
                </Form.Item>
                <Form.Item
                  name="resolution"
                  label="Motivo de la resolución"
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: "Describe la resolución.",
                    },
                  ]}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Ej. Conteo verificado y merma confirmada"
                  />
                </Form.Item>
                <div className="form-footer modal-actions">
                  <Button onClick={() => setDetailId(null)}>Cancelar</Button>
                  <Button type="primary" className="action-tone action-adjust" htmlType="submit">
                    Resolver y ajustar existencias
                  </Button>
                </div>
              </Form>
            )}
          </>
        )}
      </Modal>
    </>
  );
}
