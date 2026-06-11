import crypto from 'crypto';
import { PaginatedResponse, PaginationQuery } from '../shared/interfaces';

export const generateAccountNumber = (): string => {
  const prefix = '2';
  const random = Math.floor(Math.random() * 1e15).toString().padStart(15, '0');
  return prefix + random;
};

export const generateIBAN = (countryCode: string = 'FR'): string => {
  const checkDigits = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const bban = Math.floor(Math.random() * 1e20).toString().padStart(20, '0');
  return `${countryCode}${checkDigits}${bban}`;
};

export const generateCardNumber = (): string => {
  let number = '4'; // Visa prefix
  for (let i = 1; i < 15; i++) {
    number += Math.floor(Math.random() * 10).toString();
  }
  // Luhn checksum
  let sum = 0;
  for (let i = 0; i < number.length; i++) {
    let digit = parseInt(number[i]);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return number + checkDigit;
};

export const generateCVV = (): string => {
  return Math.floor(100 + Math.random() * 900).toString();
};

export const generateTransactionReference = (): string => {
  return `TXN-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
};

export const generateLoanReference = (): string => {
  return `LOAN-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
};

export const paginate = <T>(
  rows: T[],
  count: number,
  query: PaginationQuery
): PaginatedResponse<T> => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  return {
    data: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};

export const calculateMonthlyPayment = (
  principal: number,
  annualRate: number,
  termMonths: number
): number => {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / termMonths;
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  return Math.round(payment * 100) / 100;
};
