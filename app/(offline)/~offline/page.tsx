export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-950 p-6 text-center">
      <div className="max-w-sm space-y-4">
        <h1 className="font-serif text-2xl font-bold text-stone-200">オフライン</h1>
        <p className="font-mono text-sm text-stone-500">
          ネットワークに接続されていません。接続を確認してから再試行してください。
        </p>
      </div>
    </div>
  )
}
