'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export default function Page() {
  const [isHovering, setIsHovering] = useState(false)

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-stone-950">
      {/* Background texture overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')] opacity-30" />
      
      {/* Falling ash particles */}
      <div className="pointer-events-none absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-stone-400/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}%`,
              animation: `fall ${10 + Math.random() * 20}s linear infinite`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        {/* Title */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 
            className="font-serif text-4xl font-bold tracking-wider text-stone-300 md:text-5xl"
            style={{
              textShadow: '2px 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)',
              fontVariant: 'small-caps',
              letterSpacing: '0.15em',
            }}
          >
            LIFE QUEST
          </h1>
          <p 
            className="font-serif text-base tracking-widest text-stone-500 md:text-lg"
            style={{
              textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
              letterSpacing: '0.25em',
            }}
          >
            灰の試練
          </p>
        </div>

        {/* Cold Altar/Bonfire */}
        <div className="relative">
          <div 
            className={`relative h-80 w-80 transition-all duration-700 md:h-96 md:w-96 ${
              isHovering ? 'scale-105' : 'scale-100'
            }`}
          >
            {/* Altar image */}
            <div className="relative h-full w-full overflow-hidden rounded-sm">
              <Image
                src="/images/cold-altar.jpg"
                alt="Cold Altar"
                fill
                className="object-cover opacity-70"
                priority
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent" />
            </div>

            {/* Glow effect on hover */}
            {isHovering && (
              <>
                <div 
                  className="absolute inset-0 animate-pulse rounded-sm"
                  style={{
                    background: 'radial-gradient(circle, rgba(220, 38, 38, 0.3) 0%, transparent 70%)',
                    animationDuration: '2s',
                  }}
                />
                {/* Sparks */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute h-1 w-1 rounded-full bg-orange-500"
                    style={{
                      left: `${45 + Math.random() * 10}%`,
                      top: `${45 + Math.random() * 10}%`,
                      animation: `spark ${1 + Math.random()}s ease-out infinite`,
                      animationDelay: `${Math.random() * 2}s`,
                      boxShadow: '0 0 4px rgba(249, 115, 22, 0.8)',
                    }}
                  />
                ))}
              </>
            )}
          </div>

          {/* Ambient glow base */}
          <div 
            className={`absolute inset-0 -z-10 blur-3xl transition-opacity duration-700 ${
              isHovering ? 'opacity-60' : 'opacity-20'
            }`}
            style={{
              background: 'radial-gradient(circle, rgba(220, 38, 38, 0.4) 0%, transparent 70%)',
            }}
          />
        </div>

        {/* Ember button */}
        <div className="flex flex-col items-center gap-6">
          <Button
            size="lg"
            className="group relative overflow-hidden rounded-sm border-2 border-orange-900/50 bg-stone-900 px-12 py-6 font-serif text-lg tracking-wider text-stone-300 transition-all duration-300 hover:border-orange-700 hover:bg-orange-950/50 hover:text-orange-200"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Ember glow effect */}
            <div 
              className={`absolute inset-0 transition-opacity duration-300 ${
                isHovering ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                background: 'radial-gradient(circle at center, rgba(249, 115, 22, 0.3) 0%, transparent 70%)',
              }}
            />
            <span className="relative z-10 flex items-center gap-3">
              <span className={`h-2 w-2 rounded-full transition-all duration-300 ${
                isHovering 
                  ? 'animate-pulse bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]' 
                  : 'bg-orange-900/50'
              }`} />
              New Game
              <span className="text-sm">火を焚べる</span>
            </span>
          </Button>

          <button
            className="font-mono text-sm tracking-wider text-stone-600 transition-colors hover:text-stone-500"
          >
            Continue
            <span className="ml-2 text-xs">継続</span>
          </button>
        </div>
      </div>

      {/* Vignette effect */}
      <div 
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.6) 100%)',
        }}
      />

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-20px) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(100vh) translateX(20px);
            opacity: 0;
          }
        }

        @keyframes spark {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-30px) translateX(${Math.random() > 0.5 ? '' : '-'}${5 + Math.random() * 10}px) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
