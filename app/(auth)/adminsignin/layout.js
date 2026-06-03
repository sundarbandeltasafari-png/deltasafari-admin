'use client'

export default function AuthLayout({ children }) {
  return (
    <div className="container d-flex flex-column">  
        {children}
    </div>
  )
}
