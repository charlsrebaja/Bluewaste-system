export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getPaginationParams = (query: {
  page?: string;
  limit?: string;
}): PaginationParams => {
  const parsedPage = Number.parseInt(query.page ?? "1", 10);
  const parsedLimit = Number.parseInt(query.limit ?? "20", 10);

  const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
  const limit = Number.isNaN(parsedLimit)
    ? 20
    : Math.min(100, Math.max(1, parsedLimit));

  return { page, limit };
};

export const buildPaginatedResponse = <T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResponse<T> => {
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
};
