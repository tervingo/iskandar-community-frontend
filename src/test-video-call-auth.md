# Test de Corrección de Autenticación en Videollamadas

## Problema identificado:
Los componentes de videollamadas usaban `localStorage.getItem('token')` pero el sistema de autenticación cambió a usar `sessionStorage.getItem('auth_token')` a través del `authStore`.

## Correcciones realizadas:

### ✅ CreateCallModal.tsx
- ✅ Agregado import `useAuthStore`
- ✅ Cambiado de `localStorage.getItem('token')` a `const { token } = useAuthStore()`
- ✅ Agregada validación de token antes de hacer la petición

### ✅ MeetingRoomList.tsx
- ✅ Agregado import `useAuthStore`
- ✅ Cambiado de `localStorage.getItem('token')` a `const { token } = useAuthStore()`
- ✅ Agregada validación de token antes de hacer las peticiones (2 ubicaciones)

### ✅ CallHistory.tsx
- ✅ Agregado import `useAuthStore`
- ✅ Cambiado de `localStorage.getItem('token')` a `const { token } = useAuthStore()`
- ✅ Agregada validación de token antes de hacer la petición

### ✅ OnlineUsersList.tsx y VideoCallRoom.tsx
- ✅ Ya estaban usando correctamente `useAuthStore`

## Resultado esperado:
- No más tokens "null" en los logs
- Las peticiones POST de videollamadas deberían funcionar correctamente
- Los usuarios autenticados pueden crear salas de reunión sin errores 401

## Para probar:
1. Asegurarse de estar autenticado en la aplicación
2. Ir a la sección de Videollamadas
3. Intentar crear una nueva sala de reunión
4. Verificar que no haya errores 401 en los logs del servidor