import { supabase } from "@/lib/supabase";


export async function buscarMelhoresCiclosUsuario(
  perfilId: string
) {

  const { data, error } = await supabase
    .rpc(
      "buscar_melhores_ciclos_usuario_v2",
      {
        p_perfil_id: perfilId
      }
    );


  if (error) {
    console.error(
      "Erro ao buscar ciclos:",
      error
    );

    throw error;
  }


  return data;

}