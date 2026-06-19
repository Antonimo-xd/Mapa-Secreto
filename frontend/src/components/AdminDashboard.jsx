import { useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminDashboard = ({ isOpen, onClose, tiendas }) => {
  if (!isOpen) return null;

  // COLORES MODERNOS PARA LOS GRÁFICOS
  const COLORES = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  // PROCESAMIENTO DE DATOS (Matemáticas en segundo plano)
  const metricas = useMemo(() => {
    // 1. Tiendas por Categoría (Gráfico de Torta)
    const conteoCategorias = {};
    // 2. Tiendas por Rango de Precios (Gráfico de Barras)
    const conteoPrecios = { '1 ($)': 0, '2 ($$)': 0, '3 ($$$)': 0, '4 ($$$$)': 0 };
    
    let totalVerificadas = 0;

    tiendas.forEach(t => {
      // Contar categorías
      if (t.categorias_detalle && t.categorias_detalle.length > 0) {
        t.categorias_detalle.forEach(cat => {
          conteoCategorias[cat.nombre] = (conteoCategorias[cat.nombre] || 0) + 1;
        });
      } else {
        conteoCategorias['Sin Categoría'] = (conteoCategorias['Sin Categoría'] || 0) + 1;
      }

      // Contar precios
      const precio = t.rango_precios || 1;
      conteoPrecios[`${precio} (${'$'.repeat(precio)})`] += 1;

      // Contar verificadas
      if (t.verificado) totalVerificadas += 1;
    });

    // Formatear para Recharts
    const datosCategorias = Object.keys(conteoCategorias)
      .map(nombre => ({ name: nombre, cantidad: conteoCategorias[nombre] }))
      .sort((a, b) => b.cantidad - a.cantidad); // Ordenar de mayor a menor

    const datosPrecios = Object.keys(conteoPrecios).map(nombre => ({
      name: nombre,
      cantidad: conteoPrecios[nombre]
    }));

    return { datosCategorias, datosPrecios, totalTiendas: tiendas.length, totalVerificadas };
  }, [tiendas]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[3000] p-4 backdrop-blur-sm">
      <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] animate-fade-in">
        
        {/* ENCABEZADO */}
        <div className="bg-slate-900 p-5 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-white font-black text-xl flex items-center gap-2">
              <span>📈</span> Dashboard de Administrador
            </h2>
            <p className="text-slate-400 text-xs mt-1">Métricas y estadísticas del Mapa Secreto</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-lg font-bold transition-colors">
            ✖ Cerrar
          </button>
        </div>

        {/* CUERPO DEL DASHBOARD (CON SCROLL) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TARJETAS DE RESUMEN (Kpis) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between border-l-4 border-l-blue-500">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Lugares</p>
                <h3 className="text-3xl font-black text-slate-800">{metricas.totalTiendas}</h3>
              </div>
              <div className="text-4xl">📍</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between border-l-4 border-l-green-500">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verificadas y Activas</p>
                <h3 className="text-3xl font-black text-slate-800">{metricas.totalVerificadas}</h3>
              </div>
              <div className="text-4xl">✅</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between border-l-4 border-l-purple-500">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Categorías Creadas</p>
                <h3 className="text-3xl font-black text-slate-800">{metricas.datosCategorias.length}</h3>
              </div>
              <div className="text-4xl">🏷️</div>
            </div>
          </div>

          {/* GRÁFICOS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Gráfico 1: Torta (Categorías) */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-80">
              <h3 className="text-sm font-black text-slate-700 uppercase mb-4 text-center">Distribución por Categoría</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie 
                      data={metricas.datosCategorias} 
                      cx="50%" cy="50%" 
                      innerRadius={60} outerRadius={90} 
                      paddingAngle={5} dataKey="cantidad"
                    >
                      {metricas.datosCategorias.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value} lugares`, 'Cantidad']} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 2: Barras (Precios) */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-80">
              <h3 className="text-sm font-black text-slate-700 uppercase mb-4 text-center">Lugares por Rango de Precio</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metricas.datosPrecios} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#f8fafc'}} formatter={(value) => [`${value} lugares`, 'Cantidad']} />
                    <Bar dataKey="cantidad" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                      {metricas.datosPrecios.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORES[(index + 1) % COLORES.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;