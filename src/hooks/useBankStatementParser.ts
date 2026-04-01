import { useState, useCallback } from 'react';

export interface BankTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  mode: string;
  amount: number;
  transactionTimestamp: string;
  valueDate: string;
  txnId: string;
  narration: string;
  reference: string;
  category: string;
}

interface ParseResult {
  transactions: BankTransaction[];
  errors: string[];
  isValid: boolean;
}

const REQUIRED_COLUMNS = [
  'type',
  'mode', 
  'amount',
  'currentBalance',
  'transactionTimestamp',
  'valueDate',
  'txnId',
  'narration',
  'reference'
];

// AI-based category detection from narration
const categorizeTransaction = (narration: string, type: string): string => {
  const lowerNarration = narration.toLowerCase();
  
  if (type === 'CREDIT') {
    if (lowerNarration.includes('salary') || lowerNarration.includes('payroll')) return 'Salary';
    if (lowerNarration.includes('refund')) return 'Refund';
    if (lowerNarration.includes('interest')) return 'Interest';
    if (lowerNarration.includes('dividend')) return 'Investment';
    if (lowerNarration.includes('transfer') || lowerNarration.includes('neft') || lowerNarration.includes('imps')) return 'Transfer';
    return 'Income';
  }
  
  // Debit categorization
  if (lowerNarration.includes('swiggy') || lowerNarration.includes('zomato') || lowerNarration.includes('food') || lowerNarration.includes('restaurant') || lowerNarration.includes('grocery')) return 'Food';
  if (lowerNarration.includes('uber') || lowerNarration.includes('ola') || lowerNarration.includes('petrol') || lowerNarration.includes('fuel') || lowerNarration.includes('travel')) return 'Travel';
  if (lowerNarration.includes('rent') || lowerNarration.includes('house')) return 'Rent';
  if (lowerNarration.includes('amazon') || lowerNarration.includes('flipkart') || lowerNarration.includes('shopping') || lowerNarration.includes('myntra')) return 'Shopping';
  if (lowerNarration.includes('electricity') || lowerNarration.includes('water') || lowerNarration.includes('gas') || lowerNarration.includes('bill') || lowerNarration.includes('recharge') || lowerNarration.includes('subscription')) return 'Bills';
  if (lowerNarration.includes('atm') || lowerNarration.includes('withdrawal') || lowerNarration.includes('cash')) return 'Cash';
  if (lowerNarration.includes('transfer') || lowerNarration.includes('neft') || lowerNarration.includes('imps') || lowerNarration.includes('upi')) return 'Transfer';
  
  return 'Others';
};

export const useBankStatementParser = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  const validateHeaders = (headers: string[]): { isValid: boolean; missing: string[] } => {
    const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
    const missing = REQUIRED_COLUMNS.filter(
      col => !normalizedHeaders.includes(col.toLowerCase())
    );
    return { isValid: missing.length === 0, missing };
  };

  const parseCSV = useCallback((content: string): ParseResult => {
    const lines = content.split('\n').filter(line => line.trim());
    const errors: string[] = [];
    const transactions: BankTransaction[] = [];

    if (lines.length < 2) {
      return { transactions: [], errors: ['CSV file is empty or has no data rows'], isValid: false };
    }

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const headerValidation = validateHeaders(headers);
    
    if (!headerValidation.isValid) {
      return { 
        transactions: [], 
        errors: [`Missing required columns: ${headerValidation.missing.join(', ')}`], 
        isValid: false 
      };
    }

    // Create header index map
    const headerIndex: Record<string, number> = {};
    headers.forEach((h, i) => {
      headerIndex[h] = i;
    });

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      
      if (values.length < headers.length) {
        errors.push(`Row ${i + 1}: Incomplete data`);
        continue;
      }

      const type = values[headerIndex['type']]?.toUpperCase();
      const amount = parseFloat(values[headerIndex['amount']]);

      if (!type || (type !== 'CREDIT' && type !== 'DEBIT')) {
        errors.push(`Row ${i + 1}: Invalid type "${values[headerIndex['type']]}". Must be CREDIT or DEBIT`);
        continue;
      }

      if (isNaN(amount) || amount < 0) {
        errors.push(`Row ${i + 1}: Invalid amount "${values[headerIndex['amount']]}"`);
        continue;
      }

      const narration = values[headerIndex['narration']] || '';
      
      transactions.push({
        id: values[headerIndex['txnid']] || `txn-${i}-${Date.now()}`,
        type: type as 'CREDIT' | 'DEBIT',
        mode: values[headerIndex['mode']] || 'Unknown',
        amount,
        transactionTimestamp: values[headerIndex['transactiontimestamp']] || new Date().toISOString(),
        valueDate: values[headerIndex['valuedate']] || new Date().toISOString(),
        txnId: values[headerIndex['txnid']] || `txn-${i}`,
        narration,
        reference: values[headerIndex['reference']] || '',
        category: categorizeTransaction(narration, type)
      });
    }

    return {
      transactions,
      errors,
      isValid: transactions.length > 0
    };
  }, []);

  const parseFile = useCallback((file: File): Promise<ParseResult> => {
    return new Promise((resolve) => {
      setIsLoading(true);
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const result = parseCSV(content);
        setParseResult(result);
        setIsLoading(false);
        resolve(result);
      };

      reader.onerror = () => {
        const result = { transactions: [], errors: ['Failed to read file'], isValid: false };
        setParseResult(result);
        setIsLoading(false);
        resolve(result);
      };

      reader.readAsText(file);
    });
  }, [parseCSV]);

  return { parseFile, parseResult, isLoading, setParseResult };
};
