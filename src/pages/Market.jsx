import TabBar from '../components/TabBar'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

const Market = () => {
  // Placeholder data - será substituído por dados reais posteriormente
  const cryptos = [
    { symbol: 'BTC', name: 'Bitcoin', price: 67234.50, change: 2.34, trending: 'up' },
    { symbol: 'ETH', name: 'Ethereum', price: 3456.78, change: -1.23, trending: 'down' },
    { symbol: 'BNB', name: 'Binance Coin', price: 456.12, change: 0.89, trending: 'up' },
    { symbol: 'SOL', name: 'Solana', price: 123.45, change: 5.67, trending: 'up' },
  ]

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-card to-background border-b border-border">
        <div className="max-w-screen-xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Mercado</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Acompanhe os principais ativos em tempo real
          </p>
        </div>
      </div>

      {/* Market List */}
      <div className="max-w-screen-xl mx-auto px-6 py-8">
        <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border overflow-hidden">
          {cryptos.map((crypto, index) => (
            <div
              key={crypto.symbol}
              className={`flex items-center justify-between p-6 hover:bg-muted/20 transition-colors ${
                index !== cryptos.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-lg">{crypto.symbol}</p>
                  <p className="text-sm text-muted-foreground">{crypto.name}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold text-lg">
                  ${crypto.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div
                  className={`flex items-center gap-1 justify-end ${
                    crypto.trending === 'up' ? 'text-primary' : 'text-destructive'
                  }`}
                >
                  {crypto.trending === 'up' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {crypto.change > 0 ? '+' : ''}
                    {crypto.change}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-secondary/10 border border-secondary/30 rounded-xl p-6">
          <p className="text-sm text-center text-muted-foreground">
            💡 <strong>Em breve:</strong> Dados em tempo real, gráficos avançados e análises personalizadas
          </p>
        </div>
      </div>

      <TabBar />
    </div>
  )
}

export default Market

