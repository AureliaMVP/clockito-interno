# Clockito (interno)

Mini-clon de Clockify para uso interno (sin mobile, single-tenant).

## Requisitos
- Node.js 18+

## Pasos rápidos
1. Backend: `cd backend && npm install && npm run migrate && npm run seed && npm run dev` (levanta en http://localhost:4000)
2. Frontend: `cd ../frontend && npm install && npm run dev` (levanta en http://localhost:3000)

Usuarios de ejemplo:
- u_admin (admin@local)
- u_lucho (lucho@local)
- u_franco (franco@local)

Tip: el frontend manda `x-user-id: u_lucho` para simular sesiones (simple, interno).
