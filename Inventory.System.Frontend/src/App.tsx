import { App as AntApp, ConfigProvider } from 'antd'
import esES from 'antd/locale/es_ES'
import { InventoryApp } from './InventoryApp'
import './App.css'

export default function App() {
  return (
    <ConfigProvider locale={esES} theme={{
      token: {
        colorPrimary: '#244bc3', colorInfo: '#244bc3', colorSuccess: '#146c43',
        colorWarning: '#895200', colorError: '#b42336', borderRadius: 8,
        colorText: '#182236', colorTextSecondary: '#475569', colorTextPlaceholder: '#5d6b80',
        colorBorder: '#b5c0d1', colorBorderSecondary: '#e0e6ef',
        fontFamily: 'Arial, sans-serif', fontFamilyCode: 'Arial, sans-serif',
        fontSize: 16, fontSizeSM: 14, controlHeight: 44,
      },
      components: {
        Table: { headerBg: '#dce7fa', headerColor: '#23395d', headerSortActiveBg: '#cedefa', headerSortHoverBg: '#cedefa', rowHoverBg: '#e7f0ff', cellPaddingBlock: 16, borderColor: '#ced9eb' },
        Button: {
          colorPrimaryHover: '#2143af', colorPrimaryActive: '#19358d',
          primaryShadow: 'none', dangerShadow: 'none', defaultShadow: 'none',
        },
      },
    }}>
      <AntApp><InventoryApp /></AntApp>
    </ConfigProvider>
  )
}
