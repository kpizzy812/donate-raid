// frontend/src/components/ContactButtons.tsx - ИСПРАВЛЕННОЕ ПОЗИЦИОНИРОВАНИЕ
'use client'

import { useState } from 'react'

export default function ContactButtons() {
  const [showTooltip, setShowTooltip] = useState<string | null>(null)

  const contacts = [
    {
      id: 'telegram',
      name: 'Telegram',
      url: 'https://t.me/donateraid_support', // Замените на ваш Telegram
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.626 0 12 0zm5.568 8.16c-.169 1.58-.896 5.728-1.267 7.595-.157.791-.465.956-.769.978-.653.06-1.151-.431-1.786-.845-1.734-1.12-2.714-1.816-4.398-2.91-1.947-1.264-.685-1.963.425-3.101.292-.301 5.363-4.915 5.465-5.339.012-.053.024-.252-.094-.357-.118-.105-.292-.069-.417-.04-.177.04-3.001 1.908-8.466 5.606-.802.561-1.528.832-2.181.814-.718-.02-2.098-.406-3.124-.741-1.259-.41-2.26-.627-2.175-1.323.044-.36.527-.727 1.449-1.103 5.684-2.478 9.472-4.109 11.363-4.897 5.417-2.252 6.544-2.643 7.283-2.654.161-.002.522.037.755.227.196.16.25.383.277.537.027.154.061.504.034.777z"/>
        </svg>
      ),
      color: 'bg-blue-500 hover:bg-blue-600',
    },
  ]

  const handleContactClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fixed bottom-6 right-20 z-[9998] flex flex-col gap-3">
      {contacts.map((contact) => (
        <div key={contact.id} className="relative">
          <button
            onClick={() => handleContactClick(contact.url)}
            onMouseEnter={() => setShowTooltip(contact.id)}
            onMouseLeave={() => setShowTooltip(null)}
            className={`${contact.color} text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl`}
            title={`Связаться через ${contact.name}`}
          >
            {contact.icon}
          </button>

          {/* Tooltip */}
          {showTooltip === contact.id && (
            <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-zinc-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
              Связаться через {contact.name}
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-zinc-900"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}