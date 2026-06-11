# Analyse de Couverture de Test - Systeme Bancaire API

## Fonctionnalites Analysees

1. Login (AuthService.login)
2. Deposit (TransactionService.deposit)
3. Withdraw (TransactionService.withdraw)
4. Transfer (TransactionService.transfer)
5. Loan Apply (LoanService.apply)


## 1. LOGIN - AuthService.login()

### Code source simplifie

```typescript
async login(email: string, password: string) {
  const user = await User.findOne({ where: { email } });       // N1

  if (!user) {                                                   // N2
    throw new UnauthorizedError('Invalid email or password');    // N3
  }

  if (!user.isActive) {                                          // N4
    throw new UnauthorizedError('Account is deactivated');       // N5
  }

  const isMatch = await user.comparePassword(password);          // N6

  if (!isMatch) {                                                // N7
    throw new UnauthorizedError('Invalid email or password');    // N8
  }

  await user.update({ lastLogin: new Date() });                  // N9
  const tokens = this.generateTokens(user);                      // N10
  return { user: user.toSafeJSON(), ...tokens };                 // N11
}
```

### CFG (Control Flow Graph)

```
        [N1] findOne(email)
          |
        [N2] user exists ?
        / \
      T/   \F
    [N3]   [N4] isActive ?
   throw    / \
          T/   \F
        [N5]  [N6] comparePassword
       throw    |
              [N7] isMatch ?
              / \
            T/   \F
          [N8]  [N9] update lastLogin
         throw    |
                [N10] generateTokens
                  |
                [N11] return
```

### Chemins identifies

| Chemin | Noeuds traverses                          | Condition              |
|--------|-------------------------------------------|------------------------|
| P1     | N1, N2, N3                                | User non trouve        |
| P2     | N1, N2, N4, N5                            | User inactif           |
| P3     | N1, N2, N4, N6, N7, N8                    | Mot de passe incorrect |
| P4     | N1, N2, N4, N6, N7, N9, N10, N11          | Login reussi           |

### Statement Coverage Table

| Noeud | TC1 (P1) | TC2 (P2) | TC3 (P3) | TC4 (P4) |
|-------|----------|----------|----------|----------|
| N1    | X        | X        | X        | X        |
| N2    | X        | X        | X        | X        |
| N3    | X        |          |          |          |
| N4    |          | X        | X        | X        |
| N5    |          | X        |          |          |
| N6    |          |          | X        | X        |
| N7    |          |          | X        | X        |
| N8    |          |          | X        |          |
| N9    |          |          |          | X        |
| N10   |          |          |          | X        |
| N11   |          |          |          | X        |

Statement Coverage = 11/11 = 100%

### Branch Coverage Table

| Decision | Branche | TC1 | TC2 | TC3 | TC4 |
|----------|---------|-----|-----|-----|-----|
| N2       | T (no user)  | X   |     |     |     |
| N2       | F (user found) |   | X   | X   | X   |
| N4       | T (inactive) |     | X   |     |     |
| N4       | F (active)   |     |     | X   | X   |
| N7       | T (no match) |     |     | X   |     |
| N7       | F (match)    |     |     |     | X   |

Branch Coverage = 6/6 = 100%

### Path Coverage Table

| Chemin | Noeuds                            | Test couvrant |
|--------|-----------------------------------|---------------|
| P1     | N1, N2, N3                        | TC1           |
| P2     | N1, N2, N4, N5                    | TC2           |
| P3     | N1, N2, N4, N6, N7, N8            | TC3           |
| P4     | N1, N2, N4, N6, N7, N9, N10, N11  | TC4           |

Path Coverage = 4/4 = 100%

### Cas de test

```typescript
describe('AuthService.login()', () => {

  // TC1 - P1 : User non trouve
  it('should throw UnauthorizedError when email does not exist', async () => {
    await expect(authService.login('unknown@test.com', 'password'))
      .rejects.toThrow('Invalid email or password');
  });

  // TC2 - P2 : Compte desactive
  it('should throw UnauthorizedError when account is deactivated', async () => {
    await expect(authService.login('inactive@test.com', 'password'))
      .rejects.toThrow('Account is deactivated');
  });

  // TC3 - P3 : Mauvais mot de passe
  it('should throw UnauthorizedError when password is incorrect', async () => {
    await expect(authService.login('active@test.com', 'wrongpassword'))
      .rejects.toThrow('Invalid email or password');
  });

  // TC4 - P4 : Login reussi
  it('should return user and tokens on successful login', async () => {
    const result = await authService.login('active@test.com', 'correctpassword');
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.user.email).toBe('active@test.com');
  });
});
```


## 2. DEPOSIT - TransactionService.deposit()

### Code source simplifie

```typescript
async deposit(data: { accountId: string; amount: number; description?: string }) {
  const account = await accountService.validateAccountActive(data.accountId); // N1
  // validateAccountActive throws: NotFoundError (N2), AccountLockedError (N3), BadRequestError (N4)

  const t = await sequelize.transaction();                                    // N5

  try {
    const newBalance = Number(account.balance) + data.amount;                 // N6
    await account.update({ balance: newBalance }, { transaction: t });        // N7
    const txn = await Transaction.create({...}, { transaction: t });          // N8
    await t.commit();                                                         // N9
    return txn;                                                               // N10
  } catch (error) {
    await t.rollback();                                                       // N11
    throw error;                                                              // N12
  }
}
```

### CFG

```
      [N1] validateAccountActive
     / | \    \
   N2  N3  N4  \
  err  err  err  \
                [N5] begin transaction
                  |
                [N6] calcul newBalance
                  |
                [N7] account.update
                  |
                [N8] Transaction.create
                / \
          error/   \success
             /      \
          [N11]    [N9] commit
            |        |
          [N12]    [N10] return
          throw
```

### Chemins identifies

| Chemin | Noeuds                              | Description             |
|--------|-------------------------------------|-------------------------|
| P1     | N1, N2                              | Compte non trouve       |
| P2     | N1, N3                              | Compte verrouille       |
| P3     | N1, N4                              | Compte inactif          |
| P4     | N1, N5, N6, N7, N8, N9, N10        | Depot reussi            |
| P5     | N1, N5, N6, N7, N8, N11, N12       | Erreur DB, rollback     |

### Statement Coverage Table

| Noeud | TC1 (P1) | TC2 (P2) | TC3 (P3) | TC4 (P4) | TC5 (P5) |
|-------|----------|----------|----------|----------|----------|
| N1    | X        | X        | X        | X        | X        |
| N2    | X        |          |          |          |          |
| N3    |          | X        |          |          |          |
| N4    |          |          | X        |          |          |
| N5    |          |          |          | X        | X        |
| N6    |          |          |          | X        | X        |
| N7    |          |          |          | X        | X        |
| N8    |          |          |          | X        | X        |
| N9    |          |          |          | X        |          |
| N10   |          |          |          | X        |          |
| N11   |          |          |          |          | X        |
| N12   |          |          |          |          | X        |

Statement Coverage = 12/12 = 100%

### Branch Coverage Table

| Decision         | Branche           | TC1 | TC2 | TC3 | TC4 | TC5 |
|------------------|-------------------|-----|-----|-----|-----|-----|
| N1 validate      | not found         | X   |     |     |     |     |
| N1 validate      | locked            |     | X   |     |     |     |
| N1 validate      | inactive          |     |     | X   |     |     |
| N1 validate      | active            |     |     |     | X   | X   |
| N8 try/catch     | success           |     |     |     | X   |     |
| N8 try/catch     | error             |     |     |     |     | X   |

Branch Coverage = 6/6 = 100%

### Path Coverage Table

| Chemin | Noeuds                         | Test couvrant |
|--------|--------------------------------|---------------|
| P1     | N1, N2                         | TC1           |
| P2     | N1, N3                         | TC2           |
| P3     | N1, N4                         | TC3           |
| P4     | N1, N5, N6, N7, N8, N9, N10   | TC4           |
| P5     | N1, N5, N6, N7, N8, N11, N12  | TC5           |

Path Coverage = 5/5 = 100%

### Cas de test

```typescript
describe('TransactionService.deposit()', () => {

  // TC1 - P1
  it('should throw NotFoundError when account does not exist', async () => {
    await expect(transactionService.deposit({ accountId: 'non-existent-uuid', amount: 100 }))
      .rejects.toThrow('Account not found');
  });

  // TC2 - P2
  it('should throw AccountLockedError when account is locked', async () => {
    await expect(transactionService.deposit({ accountId: lockedAccountId, amount: 100 }))
      .rejects.toThrow('Account is locked');
  });

  // TC3 - P3
  it('should throw BadRequestError when account is not active', async () => {
    await expect(transactionService.deposit({ accountId: inactiveAccountId, amount: 100 }))
      .rejects.toThrow('Account is not active');
  });

  // TC4 - P4
  it('should deposit amount and return transaction', async () => {
    const result = await transactionService.deposit({
      accountId: activeAccountId, amount: 500, description: 'Test deposit'
    });
    expect(result.amount).toBe(500);
    expect(result.type).toBe('deposit');
    expect(result.status).toBe('completed');
  });

  // TC5 - P5
  it('should rollback on database error', async () => {
    jest.spyOn(Transaction, 'create').mockRejectedValueOnce(new Error('DB Error'));
    await expect(transactionService.deposit({ accountId: activeAccountId, amount: 100 }))
      .rejects.toThrow('DB Error');
  });
});
```


## 3. WITHDRAW - TransactionService.withdraw()

### Code source simplifie

```typescript
async withdraw(data: { accountId: string; amount: number; description?: string }) {
  const account = await accountService.validateAccountActive(data.accountId); // N1
  // throws: NotFoundError (N2), AccountLockedError (N3), BadRequestError (N4)

  const availableBalance = Number(account.balance) + Number(account.overdraftLimit); // N5

  if (data.amount > availableBalance) {   // N6
    throw new InsufficientFundsError();   // N7
  }

  const t = await sequelize.transaction();                                    // N8

  try {
    const newBalance = Number(account.balance) - data.amount;                 // N9
    await account.update({ balance: newBalance }, { transaction: t });        // N10
    const txn = await Transaction.create({...}, { transaction: t });          // N11
    await t.commit();                                                         // N12
    return txn;                                                               // N13
  } catch (error) {
    await t.rollback();                                                       // N14
    throw error;                                                              // N15
  }
}
```

### CFG

```
      [N1] validateAccountActive
     / | \    \
   N2  N3  N4  \
   err err err   \
                [N5] calcul availableBalance
                  |
                [N6] amount > available ?
                / \
              T/   \F
            [N7]  [N8] begin transaction
           throw    |
                  [N9] calcul newBalance
                    |
                  [N10] account.update
                    |
                  [N11] Transaction.create
                  / \
            error/   \success
               /      \
            [N14]    [N12] commit
              |        |
            [N15]    [N13] return
            throw
```

### Chemins identifies

| Chemin | Noeuds                                    | Description             |
|--------|-------------------------------------------|-------------------------|
| P1     | N1, N2                                    | Compte non trouve       |
| P2     | N1, N3                                    | Compte verrouille       |
| P3     | N1, N4                                    | Compte inactif          |
| P4     | N1, N5, N6, N7                            | Fonds insuffisants      |
| P5     | N1, N5, N6, N8, N9, N10, N11, N12, N13   | Retrait reussi          |
| P6     | N1, N5, N6, N8, N9, N10, N11, N14, N15   | Erreur DB, rollback     |

### Statement Coverage Table

| Noeud | TC1 (P1) | TC2 (P2) | TC3 (P3) | TC4 (P4) | TC5 (P5) | TC6 (P6) |
|-------|----------|----------|----------|----------|----------|----------|
| N1    | X        | X        | X        | X        | X        | X        |
| N2    | X        |          |          |          |          |          |
| N3    |          | X        |          |          |          |          |
| N4    |          |          | X        |          |          |          |
| N5    |          |          |          | X        | X        | X        |
| N6    |          |          |          | X        | X        | X        |
| N7    |          |          |          | X        |          |          |
| N8    |          |          |          |          | X        | X        |
| N9    |          |          |          |          | X        | X        |
| N10   |          |          |          |          | X        | X        |
| N11   |          |          |          |          | X        | X        |
| N12   |          |          |          |          | X        |          |
| N13   |          |          |          |          | X        |          |
| N14   |          |          |          |          |          | X        |
| N15   |          |          |          |          |          | X        |

Statement Coverage = 15/15 = 100%

### Branch Coverage Table

| Decision     | Branche       | TC1 | TC2 | TC3 | TC4 | TC5 | TC6 |
|--------------|---------------|-----|-----|-----|-----|-----|-----|
| N1 validate  | not found     | X   |     |     |     |     |     |
| N1 validate  | locked        |     | X   |     |     |     |     |
| N1 validate  | inactive      |     |     | X   |     |     |     |
| N1 validate  | active        |     |     |     | X   | X   | X   |
| N6 condition | T (> avail)   |     |     |     | X   |     |     |
| N6 condition | F (<= avail)  |     |     |     |     | X   | X   |
| N11 try/catch| success       |     |     |     |     | X   |     |
| N11 try/catch| error         |     |     |     |     |     | X   |

Branch Coverage = 8/8 = 100%

### Path Coverage Table

| Chemin | Noeuds                                  | Test couvrant |
|--------|-----------------------------------------|---------------|
| P1     | N1, N2                                  | TC1           |
| P2     | N1, N3                                  | TC2           |
| P3     | N1, N4                                  | TC3           |
| P4     | N1, N5, N6, N7                          | TC4           |
| P5     | N1, N5, N6, N8, N9, N10, N11, N12, N13  | TC5           |
| P6     | N1, N5, N6, N8, N9, N10, N11, N14, N15  | TC6           |

Path Coverage = 6/6 = 100%

### Cas de test

```typescript
describe('TransactionService.withdraw()', () => {

  // TC1 - P1
  it('should throw NotFoundError when account does not exist', async () => {
    await expect(transactionService.withdraw({ accountId: 'fake-uuid', amount: 100 }))
      .rejects.toThrow('Account not found');
  });

  // TC2 - P2
  it('should throw AccountLockedError when account is locked', async () => {
    await expect(transactionService.withdraw({ accountId: lockedAccountId, amount: 100 }))
      .rejects.toThrow('Account is locked');
  });

  // TC3 - P3
  it('should throw BadRequestError when account is closed', async () => {
    await expect(transactionService.withdraw({ accountId: closedAccountId, amount: 100 }))
      .rejects.toThrow('Account is not active');
  });

  // TC4 - P4
  it('should throw InsufficientFundsError when amount exceeds balance', async () => {
    await expect(transactionService.withdraw({ accountId: activeAccountId, amount: 99999 }))
      .rejects.toThrow('Insufficient funds');
  });

  // TC5 - P5
  it('should withdraw amount and return transaction', async () => {
    const result = await transactionService.withdraw({ accountId: activeAccountId, amount: 50 });
    expect(result.amount).toBe(50);
    expect(result.type).toBe('withdrawal');
    expect(result.status).toBe('completed');
  });

  // TC6 - P6
  it('should rollback on database error', async () => {
    jest.spyOn(Transaction, 'create').mockRejectedValueOnce(new Error('DB failure'));
    await expect(transactionService.withdraw({ accountId: activeAccountId, amount: 10 }))
      .rejects.toThrow('DB failure');
  });
});
```


## 4. TRANSFER - TransactionService.transfer()

### Code source simplifie

```typescript
async transfer(data: {
  fromAccountId: string; toAccountId: string; amount: number; description?: string
}) {
  if (data.fromAccountId === data.toAccountId) {                              // N1
    throw new BadRequestError('Cannot transfer to the same account');         // N2
  }

  const fromAccount = await accountService.validateAccountActive(data.fromAccountId); // N3
  // throws NotFoundError (N4)

  const toAccount = await accountService.validateAccountActive(data.toAccountId);     // N5
  // throws NotFoundError (N6)

  const availableBalance = Number(fromAccount.balance) + Number(fromAccount.overdraftLimit); // N7

  if (data.amount > availableBalance) {   // N8
    throw new InsufficientFundsError();   // N9
  }

  const t = await sequelize.transaction();                                    // N10

  try {
    const newFromBalance = Number(fromAccount.balance) - data.amount;         // N11
    const newToBalance = Number(toAccount.balance) + data.amount;
    await fromAccount.update({ balance: newFromBalance }, { transaction: t });// N12
    await toAccount.update({ balance: newToBalance }, { transaction: t });    // N13
    const txn = await Transaction.create({...}, { transaction: t });          // N14
    await t.commit();                                                         // N15
    return txn;                                                               // N16
  } catch (error) {
    await t.rollback();                                                       // N17
    throw error;                                                              // N18
  }
}
```

### CFG

```
      [N1] fromAccountId === toAccountId ?
      / \
    T/   \F
  [N2]  [N3] validate fromAccount
 throw   |   (throws N4)
        / \
      N4   \
     err    \
            [N5] validate toAccount
              |   (throws N6)
            / \
          N6   \
         err    \
               [N7] calcul availableBalance
                 |
               [N8] amount > available ?
               / \
             T/   \F
           [N9]  [N10] begin transaction
          throw    |
                 [N11] calcul balances
                   |
                 [N12] from.update
                   |
                 [N13] to.update
                   |
                 [N14] Transaction.create
                 / \
           error/   \success
              /      \
           [N17]    [N15] commit
             |        |
           [N18]    [N16] return
           throw
```

### Chemins identifies

| Chemin | Noeuds                                              | Description                  |
|--------|-----------------------------------------------------|------------------------------|
| P1     | N1, N2                                              | Meme compte                  |
| P2     | N1, N3, N4                                          | Source non trouve            |
| P3     | N1, N3, N5, N6                                      | Destination non trouve       |
| P4     | N1, N3, N5, N7, N8, N9                              | Fonds insuffisants           |
| P5     | N1, N3, N5, N7, N8, N10, N11, ..., N15, N16        | Transfert reussi             |
| P6     | N1, N3, N5, N7, N8, N10, N11, ..., N14, N17, N18   | Erreur DB, rollback          |

### Statement Coverage Table

| Noeud | TC1 (P1) | TC2 (P2) | TC3 (P3) | TC4 (P4) | TC5 (P5) | TC6 (P6) |
|-------|----------|----------|----------|----------|----------|----------|
| N1    | X        | X        | X        | X        | X        | X        |
| N2    | X        |          |          |          |          |          |
| N3    |          | X        | X        | X        | X        | X        |
| N4    |          | X        |          |          |          |          |
| N5    |          |          | X        | X        | X        | X        |
| N6    |          |          | X        |          |          |          |
| N7    |          |          |          | X        | X        | X        |
| N8    |          |          |          | X        | X        | X        |
| N9    |          |          |          | X        |          |          |
| N10   |          |          |          |          | X        | X        |
| N11   |          |          |          |          | X        | X        |
| N12   |          |          |          |          | X        | X        |
| N13   |          |          |          |          | X        | X        |
| N14   |          |          |          |          | X        | X        |
| N15   |          |          |          |          | X        |          |
| N16   |          |          |          |          | X        |          |
| N17   |          |          |          |          |          | X        |
| N18   |          |          |          |          |          | X        |

Statement Coverage = 18/18 = 100%

### Branch Coverage Table

| Decision     | Branche          | TC1 | TC2 | TC3 | TC4 | TC5 | TC6 |
|--------------|------------------|-----|-----|-----|-----|-----|-----|
| N1 condition | T (same)         | X   |     |     |     |     |     |
| N1 condition | F (different)    |     | X   | X   | X   | X   | X   |
| N3 validate  | error            |     | X   |     |     |     |     |
| N3 validate  | success          |     |     | X   | X   | X   | X   |
| N5 validate  | error            |     |     | X   |     |     |     |
| N5 validate  | success          |     |     |     | X   | X   | X   |
| N8 condition | T (> avail)      |     |     |     | X   |     |     |
| N8 condition | F (<= avail)     |     |     |     |     | X   | X   |
| N14 try/catch| success          |     |     |     |     | X   |     |
| N14 try/catch| error            |     |     |     |     |     | X   |

Branch Coverage = 10/10 = 100%

### Path Coverage Table

| Chemin | Noeuds                                           | Test couvrant |
|--------|--------------------------------------------------|---------------|
| P1     | N1, N2                                           | TC1           |
| P2     | N1, N3, N4                                       | TC2           |
| P3     | N1, N3, N5, N6                                   | TC3           |
| P4     | N1, N3, N5, N7, N8, N9                           | TC4           |
| P5     | N1, N3, N5, N7, N8, N10 ... N15, N16             | TC5           |
| P6     | N1, N3, N5, N7, N8, N10 ... N14, N17, N18        | TC6           |

Path Coverage = 6/6 = 100%

### Cas de test

```typescript
describe('TransactionService.transfer()', () => {

  // TC1 - P1
  it('should throw BadRequestError when transferring to same account', async () => {
    await expect(transactionService.transfer({
      fromAccountId: 'uuid-1', toAccountId: 'uuid-1', amount: 100
    })).rejects.toThrow('Cannot transfer to the same account');
  });

  // TC2 - P2
  it('should throw NotFoundError when source account does not exist', async () => {
    await expect(transactionService.transfer({
      fromAccountId: 'non-existent', toAccountId: validAccountId, amount: 100
    })).rejects.toThrow('Account not found');
  });
  
  // TC3 - P3
  it('should throw NotFoundError when destination account does not exist', async () => {
    await expect(transactionService.transfer({
      fromAccountId: validAccountId, toAccountId: 'non-existent', amount: 100
    })).rejects.toThrow('Account not found');
  });

  // TC4 - P4
  it('should throw InsufficientFundsError when balance is too low', async () => {
    await expect(transactionService.transfer({
      fromAccountId: lowBalanceAccountId, toAccountId: validAccountId2, amount: 999999
    })).rejects.toThrow('Insufficient funds');
  });

  // TC5 - P5
  it('should transfer amount between accounts successfully', async () => {
    const result = await transactionService.transfer({
      fromAccountId: fundedAccountId, toAccountId: validAccountId2, amount: 200
    });
    expect(result.type).toBe('transfer');
    expect(result.amount).toBe(200);
    expect(result.status).toBe('completed');
  });

  // TC6 - P6
  it('should rollback both accounts on database error', async () => {
    jest.spyOn(Transaction, 'create').mockRejectedValueOnce(new Error('Network error'));
    await expect(transactionService.transfer({
      fromAccountId: fundedAccountId, toAccountId: validAccountId2, amount: 100
    })).rejects.toThrow('Network error');
  });
});
```


## 5. LOAN APPLY - LoanService.apply()

### Code source simplifie

```typescript
async apply(userId: string, data: {
  accountId: string; type: LoanType; amount: number; termMonths: number; description: string
}) {
  const account = await Account.findOne({ where: { id: data.accountId, userId } }); // N1

  if (!account) {                         // N2
    throw new NotFoundError('Account');   // N3
  }

  const interestRate = this.getInterestRate(data.type);                              // N4
  const monthlyPayment = calculateMonthlyPayment(
    data.amount, interestRate, data.termMonths
  );                                                                                  // N5

  const loan = await Loan.create({
    reference: generateLoanReference(),
    userId, accountId: data.accountId, type: data.type,
    amount: data.amount, interestRate, termMonths: data.termMonths,
    monthlyPayment,
    remainingBalance: data.amount + (monthlyPayment * data.termMonths - data.amount),
    description: data.description,
  });                                                                                 // N6

  return loan;                                                                        // N7
}
```

### CFG

```
      [N1] Account.findOne
        |
      [N2] account exists ?
      / \
    T/   \F
  [N3]  [N4] getInterestRate
 throw    |
        [N5] calculateMonthlyPayment
          |
        [N6] Loan.create
          |
        [N7] return loan
```

### Chemins identifies

| Chemin | Noeuds                     | Description                              |
|--------|----------------------------|------------------------------------------|
| P1     | N1, N2, N3                 | Compte non trouve ou non lie a l'user    |
| P2     | N1, N2, N4, N5, N6, N7    | Demande de pret reussie                  |

### Statement Coverage Table

| Noeud | TC1 (P1) | TC2 (P2) | TC3 (P2) | TC4 (P2) |
|-------|----------|----------|----------|----------|
| N1    | X        | X        | X        | X        |
| N2    | X        | X        | X        | X        |
| N3    | X        |          |          |          |
| N4    |          | X        | X        | X        |
| N5    |          | X        | X        | X        |
| N6    |          | X        | X        | X        |
| N7    |          | X        | X        | X        |

Statement Coverage = 7/7 = 100%

### Branch Coverage Table

| Decision     | Branche         | TC1 | TC2 | TC3 | TC4 |
|--------------|-----------------|-----|-----|-----|-----|
| N2 condition | T (no account)  | X   |     |     |     |
| N2 condition | F (found)       |     | X   | X   | X   |

Branch Coverage = 2/2 = 100%

### Path Coverage Table

| Chemin | Noeuds                  | Test couvrant |
|--------|-------------------------|---------------|
| P1     | N1, N2, N3              | TC1           |
| P2     | N1, N2, N4, N5, N6, N7  | TC2, TC3, TC4 |

Path Coverage = 2/2 = 100%

### Cas de test

```typescript
describe('LoanService.apply()', () => {

  // TC1 - P1 : Compte non trouve
  it('should throw NotFoundError when account does not belong to user', async () => {
    await expect(loanService.apply('user-id', {
      accountId: 'other-user-account',
      type: LoanType.PERSONAL,
      amount: 10000,
      termMonths: 24,
      description: 'Test loan'
    })).rejects.toThrow('Account not found');
  });

  // TC2 - P2 : Pret personnel (taux 5.5%)
  it('should create a personal loan with correct interest rate', async () => {
    const result = await loanService.apply(userId, {
      accountId: validAccountId,
      type: LoanType.PERSONAL,
      amount: 10000,
      termMonths: 24,
      description: 'Personal loan'
    });
    expect(result.type).toBe('personal');
    expect(result.interestRate).toBe(5.5);
    expect(result.status).toBe('pending');
    expect(result.monthlyPayment).toBeGreaterThan(0);
  });

  // TC3 - P2 : Pret hypothecaire (taux 3.2%)
  it('should create a mortgage loan with correct interest rate', async () => {
    const result = await loanService.apply(userId, {
      accountId: validAccountId,
      type: LoanType.MORTGAGE,
      amount: 200000,
      termMonths: 240,
      description: 'Mortgage'
    });
    expect(result.type).toBe('mortgage');
    expect(result.interestRate).toBe(3.2);
  });

  // TC4 - P2 : Pret auto (taux 4.0%)
  it('should create an auto loan with correct interest rate', async () => {
    const result = await loanService.apply(userId, {
      accountId: validAccountId,
      type: LoanType.AUTO,
      amount: 25000,
      termMonths: 60,
      description: 'Car loan'
    });
    expect(result.type).toBe('auto');
    expect(result.interestRate).toBe(4.0);
  });
});
```


## Resume Global

| Fonctionnalite | Chemins | Tests | Statement | Branch | Path  |
|----------------|---------|-------|-----------|--------|-------|
| Login          | 4       | 4     | 100%      | 100%   | 100%  |
| Deposit        | 5       | 5     | 100%      | 100%   | 100%  |
| Withdraw       | 6       | 6     | 100%      | 100%   | 100%  |
| Transfer       | 6       | 6     | 100%      | 100%   | 100%  |
| Loan Apply     | 2       | 4     | 100%      | 100%   | 100%  |
| TOTAL          | 23      | 25    | 100%      | 100%   | 100%  |

### Definitions

- Statement Coverage : chaque instruction (noeud) du code est executee au moins une fois
- Branch Coverage : chaque branche (True/False) de chaque decision est traversee au moins une fois
- Path Coverage : chaque chemin unique du debut a la fin de la fonction est couvert par au moins un cas de test
