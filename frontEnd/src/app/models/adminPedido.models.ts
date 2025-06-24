export interface IAdminPedido {
    _id: string;
    usuario_id: string;
    estado: string;
    aprobado_por: string;
    fecha_aprobacion: Date;
    cervezas: Array<{
        cerveza: string;
        cantidad: number;
    }>;
    fecha: Date;
}