declare module 'sequelize' {
  import { Sequelize as SequelizeType } from 'sequelize/types';

  export class Sequelize {
    constructor(uri: string, options?: any);
    constructor(database: string, username: string, password: string, options?: any);
    authenticate(): Promise<void>;
    sync(options?: any): Promise<any>;
    transaction(): Promise<any>;
    define(modelName: string, attributes: any, options?: any): any;
  }

  export class Model<T = any, C = any> {
    public static init(attributes: any, options: any): void;
    public static findOne(options?: any): Promise<any>;
    public static findByPk(id: any, options?: any): Promise<any>;
    public static findAll(options?: any): Promise<any[]>;
    public static findAndCountAll(options?: any): Promise<{ rows: any[]; count: number }>;
    public static create(data: any, options?: any): Promise<any>;
    public static destroy(options?: any): Promise<number>;
    public static hasMany(target: any, options?: any): void;
    public static belongsTo(target: any, options?: any): void;
    public static hasOne(target: any, options?: any): void;
    public static belongsToMany(target: any, options?: any): void;
    public update(data: any, options?: any): Promise<any>;
    public destroy(options?: any): Promise<void>;
    public toJSON(): any;
    public changed(field?: string): boolean;
    public save(options?: any): Promise<any>;
  }

  export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

  export const DataTypes: {
    UUID: any;
    UUIDV4: any;
    STRING: (length?: number) => any;
    INTEGER: any;
    FLOAT: any;
    DECIMAL: (precision?: number, scale?: number) => any;
    BOOLEAN: any;
    DATE: any;
    DATEONLY: any;
    TEXT: any;
    JSONB: any;
    JSON: any;
    ENUM: (...values: string[]) => any;
    ARRAY: (type: any) => any;
    VIRTUAL: any;
  };

  export const Op: {
    eq: symbol;
    ne: symbol;
    gte: symbol;
    gt: symbol;
    lte: symbol;
    lt: symbol;
    not: symbol;
    is: symbol;
    in: symbol;
    notIn: symbol;
    like: symbol;
    notLike: symbol;
    iLike: symbol;
    notILike: symbol;
    startsWith: symbol;
    endsWith: symbol;
    substring: symbol;
    regexp: symbol;
    notRegexp: symbol;
    between: symbol;
    notBetween: symbol;
    overlap: symbol;
    contains: symbol;
    contained: symbol;
    adjacent: symbol;
    strictLeft: symbol;
    strictRight: symbol;
    noExtendRight: symbol;
    noExtendLeft: symbol;
    and: symbol;
    or: symbol;
    any: symbol;
    all: symbol;
    values: symbol;
    col: symbol;
    placeholder: symbol;
  };

  export default Sequelize;
}

declare module 'express-validator' {
  import { Request, Response, NextFunction } from 'express';

  export function body(field: string): any;
  export function param(field: string): any;
  export function query(field: string): any;
  export function validationResult(req: Request): {
    isEmpty(): boolean;
    array(): any[];
  };
}
