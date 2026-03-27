// DTOs for Home Module
export interface CreateHomeDto {
  userId: string;
  name: string;
  location?: string;
}

export interface UpdateHomeDto {
  name?: string;
  location?: string;
}

export interface HomeResponseDto {
  id: string;
  userId: string;
  name: string | null;
  location: string | null;
  createdAt: Date;
}

export interface GetHomesQueryDto {
  userId: string;
  skip?: number;
  take?: number;
}

export interface GetHomeByIdDto {
  id: string;
  userId: string;
}

export interface DeleteHomeDto {
  id: string;
  userId: string;
}
