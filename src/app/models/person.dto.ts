export interface PersonDto {
  businessEntityId: number;
  personType: string;
  nameStyle: boolean;
  title: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  emailPromotion: number;
  modifiedDate: Date;
}

export interface CreatePersonDto {
  personType: string;
  nameStyle?: boolean;
  title?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  emailPromotion?: number;
}

export interface UpdatePersonDto {
  personType?: string;
  nameStyle?: boolean;
  title?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  emailPromotion?: number;
}