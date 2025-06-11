import React from 'react'
import IconMap from '@/components/IconMap'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Copyright */}
          <div className="text-sm text-gray-500 flex items-center">
            © {currentYear} Familie Todo App. Laget med <IconMap type="heart" size={16} className="mx-1 text-red-500" /> for familier.
          </div>

          {/* Links */}
          <div className="flex space-x-6">
            <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Hjelp
            </button>
            <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Tilbakemelding
            </button>
            <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Personvern
            </button>
          </div>

          {/* Version */}
          <div className="text-xs text-gray-400">
            v1.0.0
          </div>
        </div>

        {/* Stats or additional info - only show on larger screens */}
        <div className="hidden lg:flex justify-center pt-4 border-t border-gray-100 mt-4">
          <div className="flex space-x-8 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <IconMap type="phone" size={16} />
              <span>Optimalisert for mobil</span>
            </div>
            <div className="flex items-center space-x-1">
              <IconMap type="lock" size={16} />
              <span>Sikker og privat</span>
            </div>
            <div className="flex items-center space-x-1">
              <IconMap type="family" size={16} />
              <span>Familie-vennlig</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer