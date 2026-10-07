import { useEffect } from 'react'

export default function DownloadPrdRedirect() {
  useEffect(() => {
    // Busca o arquivo /PRD-Apoio-Grupo-Genki-v0.0.5.md e aciona o download
    const filename = 'PRD-Apoio-Grupo-Genki-v0.0.5.md'
    const link = document.createElement('a')
    link.href = '/PRD-Apoio-Grupo-Genki-v0.0.5.md'
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#09151e] p-6 text-slate-800 dark:text-slate-200">
      <div className="max-w-md w-full p-6 bg-white dark:bg-[#0d222f] rounded-xl shadow-md border border-slate-200 dark:border-[#1b3a4f] text-center space-y-4">
        <h1 className="text-lg font-bold text-[#163A4D] dark:text-slate-100">
          Download do PRD Atualizado (v0.0.5)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Se o download do arquivo <strong>PRD-Apoio-Grupo-Genki-v0.0.5.md</strong> não iniciar
          automaticamente em alguns segundos, clique no botão abaixo:
        </p>
        <div className="pt-2">
          <a
            href="/PRD-Apoio-Grupo-Genki-v0.0.5.md"
            download="PRD-Apoio-Grupo-Genki-v0.0.5.md"
            className="inline-flex items-center justify-center px-4 py-2 bg-[#163A4D] hover:bg-[#122e3d] text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            Baixar PRD (v0.0.5)
          </a>
        </div>
      </div>
    </div>
  )
}
