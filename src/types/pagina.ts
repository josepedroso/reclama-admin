/** Envelope de paginacao usado por todos os endpoints paginados do backend (RNF-08). */
export interface PaginaResponse<T> {
  conteudo: T[];
  pagina: number;
  tamanho: number;
  totalElementos: number;
  totalPaginas: number;
}
