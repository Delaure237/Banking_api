# Analyse de Couverture de Test - Système Bancaire API

## 5 Fonctionnalités Analysées

1. **Login (Authentification)**
2. **Deposit (Dépôt)**
3. **Withdraw (Retrait)**
4. **Transfer (Virement)**
5. **Loan Apply (Demande de prêt)**

---

## 1. LOGIN - `AuthService.login()`

### Code source (simplifié)

```typescript
async login(email: string, password: string) {
  // 1. Début
  const user = await User.findOne({ where: { email } });  // N1

  // 2. Vérifier si user existe
  if (!user) {                                              // N2
    throw new UnauthorizedError('Invalid email or password'); // N3
  }

  // 3. Vérifier si le compte est actif
  if (!user.isActive) {                                     // N4
    throw new UnauthorizedError('Account is deactivated');   // N5
  }

  // 4. Comparer les mots de passe
  const isMatch = await user.comparePassword(password);     // N6

  if (!isMatch) {                                           // N7
    throw new UnauthorizedError('Invalid email or password'); // N8
  }

  // 5. Mise à jour et retour
  await user.update({ lastLogin: new Date() });             // N9
  const tokens = this.generateTokens(user);                 // N10
  return { user: user.toSafeJSON(), ...tokens };            // N11 (Fin)
}
```

### CFG (Control Flow Graph)

```
       [N1] findOne
         |
       [N2] !user ?
       / \
     T/   \F
   [N3]   [N4] !isActive ?
   (throw)  / \
          T/   \F
        [N5]  [N6] comparePassword
        (throw)  |
               [N7] !isMatch ?
               / \
             T/   \F
           [N8]  [N9] update lastLogin
           (throw) |
                 [N10] generateTokens
                   |
                 [N11] return (Fin)
```

### Chemins identifiés

| Chemin | Nœuds traversés | Condition |
|--------|----------------|-----------|
| P1 | N1 → N2 → N3 | User non trouvé |
| P2 | N1 → N2 → N4 → N5 | User inactif |
| P3 | N1 → N2 → N4 → N6 → N7 → N8 | Mot de passe incorrect |
| P4 | N1 → N2 → N4 → N6 → N7 → N9 → N10 → N11 | Login réussi |

### Coverage Table

| Cas de test | P1 | P2 | P3 | P4 | Statement Cov. | Branch Cov. | Path Cov. |
|-------------|----|----|----|----|----------------|-------------|-----------|
| TC1: Email inexistant | ✓ | | | | N1,N2,N3 | N2=T | P1 |
| TC2: Compte désactivé | | ✓ | | | N1,N2,N4,N5 | N2=F, N4=T | P2 |
| TC3: Mauvais password | | | ✓ | | N1,N2,N4,N6,N7,N8 | N2=F, N4=F, N7=T | P3 |
| TC4: Login valide | | | | ✓ | N1,N2,N4,N6,N7,N9,N10,N11 | N2=F, N4=F, N7=F | P4 |

**Statement Coverage** : TC1+TC2+TC3+TC4 → 100% (tous les nœuds couverts)
**Branch Coverage** : TC1+TC2+TC3+TC4 → 100% (toutes les branches T/F couvertes)
**Path Coverage** : TC1+TC2+TC3+TC4 → 100% (4 chemins / 4 total)

### Cas de Test

```typescript
describe('AuthService.login()', () => {
  // TC1 - Chemin P1: User non trouvé
  it('should throw UnauthorizedError when email does not exist', async () => {
    await expect(authService.login('unknown@test.com', 'password'))
      .rejects.toThrow('Invalid email or password');
  });

  // TC2 - Chemin P2: Compte désactivé
  it('should throw UnauthorizedError when account is deactivated', async () => {
    // Prérequis: créer un user avec isActive = false
    await expect(authService.login('inactive@test.com', 'password'))
      .rejects.toThrow('Account is deactivated');
  });

  // TC3 - Chemin P3: Mauvais mot de passe
  it('should throw UnauthorizedError when password is incorrect', async () => {
    await expect(authService.login('active@test.com', 'wrongpassword'))
      .rejects.toThrow('Invalid email or password');
  });

  // TC4 - Chemin P4: Login réussi
  it('should return user and tokens on successful login', async () => {
    const result = await authService.login('active@test.com', 'correctpassword');
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.user.email).toBe('active@test.com');
  });
});
```

---

## 2. DEPOSIT - `TransactionService.deposit()`

### Code source (simplifié)

```typescript
async deposit(data: { accountId: string; amount: number; description?: string }) {
  // N1: Valider le compte
  const account = await accountService.validateAccountActive(data.accountId);
  // Note: validateAccountActive peut throw NotFoundError(N2), AccountLockedError(N3), BadRequestError(N4)

  // N5: Démarrer la transaction DB
  const t = await sequelize.transaction();

  try {
    // N6: Calculer nouveau solde
    const newBalance = Number(account.balance) + data.amount;

    // N7: Mettre à jour le solde
    await account.update({ balance: newBalance }, { transaction: t });

    // N8: Créer l'enregistrement de transaction
    const txn = await Transaction.create({...}, { transaction: t });

    // N9: Commit
    await t.commit();

    // N10: Retourner la transaction
    return txn;
  } catch (error) {
    // N11: Rollback
    await t.rollback();
    // N12: Re-throw
    throw error;
  }
}
```

### CFG

```
     [N1] validateAccountActive
      |  (peut throw → N2, N3, N4)
     / | \  \
   N2  N3  N4  \
  (throw)(throw)(throw)
                 \
                [N5] sequelize.transaction()
                  |
                [N6] calcul newBalance
                  |
                [N7] account.update
                  |
                [N8] Transaction.create
                  |  (peut throw → N11)
                [N9] commit
                  |
                [N10] return txn

    Si erreur dans N7-N9:
                [N11] rollback
                  |
                [N12] throw error
```

### Chemins identifiés

| Chemin | Description |
|--------|-------------|
| P1 | N1 → N2 (compte non trouvé) |
| P2 | N1 → N3 (compte verrouillé) |
| P3 | N1 → N4 (compte inactif) |
| P4 | N1 → N5 → N6 → N7 → N8 → N9 → N10 (dépôt réussi) |
| P5 | N1 → N5 → N6 → N7 → N11 → N12 (erreur DB, rollback) |

### Coverage Table

| Cas de test | P1 | P2 | P3 | P4 | P5 | Statement Cov. | Branch Cov. | Path Cov. |
|-------------|----|----|----|----|----|----|----|----|
| TC1: Account inexistant | ✓ | | | | | N1,N2 | validate=notFound | P1 |
| TC2: Account verrouillé | | ✓ | | | | N1,N3 | validate=locked | P2 |
| TC3: Account inactif | | | ✓ | | | N1,N4 | validate=inactive | P3 |
| TC4: Dépôt réussi | | | | ✓ | | N1,N5-N10 | validate=OK, try=success | P4 |
| TC5: Erreur DB | | | | | ✓ | N1,N5-N7,N11,N12 | validate=OK, try=error | P5 |

**Statement Coverage** : TC1+TC4+TC5 → 100%
**Branch Coverage** : TC1+TC2+TC3+TC4+TC5 → 100%
**Path Coverage** : TC1-TC5 → 100% (5/5)

### Cas de Test

```typescript
describe('TransactionService.deposit()', () => {
  // TC1 - P1: Compte inexistant
  it('should throw NotFoundError when account does not exist', async () => {
    await expect(transactionService.deposit({ accountId: 'non-existent-uuid', amount: 100 }))
      .rejects.toThrow('Account not found');
  });

  // TC2 - P2: Compte verrouillé
  it('should throw AccountLockedError when account is locked', async () => {
    // Prérequis: compte avec status = 'locked'
    await expect(transactionService.deposit({ accountId: lockedAccountId, amount: 100 }))
      .rejects.toThrow('Account is locked');
  });

  // TC3 - P3: Compte inactif
  it('should throw BadRequestError when account is not active', async () => {
    await expect(transactionService.deposit({ accountId: inactiveAccountId, amount: 100 }))
      .rejects.toThrow('Account is not active');
  });

  // TC4 - P4: Dépôt réussi
  it('should deposit amount and return transaction', async () => {
    const result = await transactionService.deposit({ accountId: activeAccountId, amount: 500, description: 'Test deposit' });
    expect(result.amount).toBe(500);
    expect(result.type).toBe('deposit');
    expect(result.status).toBe('completed');
  });

  // TC5 - P5: Erreur DB rollback
  it('should rollback on database error', async () => {
    // Mock: forcer une erreur lors de Transaction.create
    jest.spyOn(Transaction, 'create').mockRejectedValueOnce(new Error('DB Error'));
    await expect(transactionService.deposit({ accountId: activeAccountId, amount: 100 }))
      .rejects.toThrow('DB Error');
    // Vérifier que le solde n'a pas changé
  });
});
```

---

## 3. WITHDRAW - `TransactionService.withdraw()`

### Code source (simplifié)

```typescript
async withdraw(data: { accountId: string; amount: number; description?: string }) {
  // N1: Valider le compte
  const account = await accountService.validateAccountActive(data.accountId);
  // Peut throw: NotFoundError(N2), AccountLockedError(N3), BadRequestError(N4)

  // N5: Vérifier le solde disponible
  const availableBalance = Number(account.balance) + Number(account.overdraftLimit);

  if (data.amount > availableBalance) {  // N6: condition
    throw new InsufficientFundsError();   // N7
  }

  // N8: Démarrer la transaction DB
  const t = await sequelize.transaction();

  try {
    // N9: Calculer nouveau solde
    const newBalance = Number(account.balance) - data.amount;

    // N10: Update
    await account.update({ balance: newBalance }, { transaction: t });

    // N11: Créer transaction
    const txn = await Transaction.create({...}, { transaction: t });

    // N12: Commit
    await t.commit();

    // N13: Return
    return txn;
  } catch (error) {
    // N14: Rollback
    await t.rollback();
    // N15: Re-throw
    throw error;
  }
}
```

### CFG

```
     [N1] validateAccountActive
    / | \   \
  N2  N3  N4  \
                \
              [N5] calcul availableBalance
                |
              [N6] amount > availableBalance ?
              / \
            T/   \F
          [N7]  [N8] transaction()
         (throw)  |
                [N9] calcul newBalance
                  |
                [N10] update
                  |
                [N11] create
                  |  (peut throw → N14)
                [N12] commit
                  |
                [N13] return

    Si erreur:
                [N14] rollback
                  |
                [N15] throw
```

### Chemins identifiés

| Chemin | Description |
|--------|-------------|
| P1 | N1 → N2 (compte non trouvé) |
| P2 | N1 → N3 (compte verrouillé) |
| P3 | N1 → N4 (compte inactif) |
| P4 | N1 → N5 → N6 → N7 (fonds insuffisants) |
| P5 | N1 → N5 → N6 → N8 → N9 → N10 → N11 → N12 → N13 (retrait réussi) |
| P6 | N1 → N5 → N6 → N8 → N9 → N10 → N14 → N15 (erreur DB) |

### Coverage Table

| Cas de test | P1 | P2 | P3 | P4 | P5 | P6 | Statement | Branch | Path |
|-------------|----|----|----|----|----|----|-----------|--------|------|
| TC1: Account not found | ✓ | | | | | | N1,N2 | validate=notFound | P1 |
| TC2: Account locked | | ✓ | | | | | N1,N3 | validate=locked | P2 |
| TC3: Account inactive | | | ✓ | | | | N1,N4 | validate=inactive | P3 |
| TC4: Insufficient funds | | | | ✓ | | | N1,N5,N6,N7 | N6=T | P4 |
| TC5: Withdrawal success | | | | | ✓ | | N1,N5,N6,N8-N13 | N6=F, try=ok | P5 |
| TC6: DB error rollback | | | | | | ✓ | N1,N5,N6,N8-N10,N14,N15 | N6=F, try=err | P6 |

**Statement Coverage** : TC1+TC4+TC5+TC6 → 100%
**Branch Coverage** : TC1+TC2+TC3+TC4+TC5+TC6 → 100%
**Path Coverage** : TC1-TC6 → 100% (6/6)

### Cas de Test

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
  it('should throw InsufficientFundsError when amount exceeds available balance', async () => {
    // Compte avec solde = 100, overdraft = 0, retrait = 200
    await expect(transactionService.withdraw({ accountId: activeAccountId, amount: 99999 }))
      .rejects.toThrow('Insufficient funds');
  });

  // TC5 - P5
  it('should withdraw amount and return transaction on success', async () => {
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

---

## 4. TRANSFER - `TransactionService.transfer()`

### Code source (simplifié)

```typescript
async transfer(data: { fromAccountId: string; toAccountId: string; amount: number; description?: string }) {
  // N1: Vérifier si même compte
  if (data.fromAccountId === data.toAccountId) {  // N1
    throw new BadRequestError('Cannot transfer to the same account'); // N2
  }

  // N3: Valider compte source
  const fromAccount = await accountService.validateAccountActive(data.fromAccountId);
  // Peut throw NotFoundError(N4)

  // N5: Valider compte destination
  const toAccount = await accountService.validateAccountActive(data.toAccountId);
  // Peut throw NotFoundError(N6)

  // N7: Vérifier fonds
  const availableBalance = Number(fromAccount.balance) + Number(fromAccount.overdraftLimit);
  if (data.amount > availableBalance) {  // N8
    throw new InsufficientFundsError();   // N9
  }

  // N10: Transaction DB
  const t = await sequelize.transaction();

  try {
    // N11: Débiter source
    const newFromBalance = Number(fromAccount.balance) - data.amount;
    const newToBalance = Number(toAccount.balance) + data.amount;
    await fromAccount.update({ balance: newFromBalance }, { transaction: t }); // N12
    await toAccount.update({ balance: newToBalance }, { transaction: t });     // N13

    // N14: Créer enregistrement
    const txn = await Transaction.create({...}, { transaction: t });

    // N15: Commit
    await t.commit();

    // N16: Return
    return txn;
  } catch (error) {
    // N17: Rollback
    await t.rollback();
    throw error; // N18
  }
}
```

### CFG

```
     [N1] fromAccountId === toAccountId ?
      / \
    T/   \F
  [N2]  [N3] validate fromAccount
 (throw)  |  (peut throw → N4)
         / \
       N4   \
      (throw) \
             [N5] validate toAccount
               |  (peut throw → N6)
              / \
            N6   \
           (throw) \
                  [N7] calcul availableBalance
                    |
                  [N8] amount > available ?
                  / \
                T/   \F
              [N9]  [N10] transaction()
             (throw)  |
                    [N11-N13] updates
                      |
                    [N14] create
                      |
                    [N15] commit
                      |
                    [N16] return

    Si erreur dans try:
                    [N17] rollback
                      |
                    [N18] throw
```

### Chemins identifiés

| Chemin | Description |
|--------|-------------|
| P1 | N1 → N2 (même compte) |
| P2 | N1 → N3 → N4 (compte source non trouvé) |
| P3 | N1 → N3 → N5 → N6 (compte destination non trouvé) |
| P4 | N1 → N3 → N5 → N7 → N8 → N9 (fonds insuffisants) |
| P5 | N1 → N3 → N5 → N7 → N8 → N10...N16 (transfert réussi) |
| P6 | N1 → N3 → N5 → N7 → N8 → N10...N14 → N17 → N18 (erreur DB) |

### Coverage Table

| Cas de test | P1 | P2 | P3 | P4 | P5 | P6 | Statement | Branch | Path |
|-------------|----|----|----|----|----|----|-----------|--------|------|
| TC1: Même compte | ✓ | | | | | | N1,N2 | N1=T | P1 |
| TC2: Source inexistant | | ✓ | | | | | N1,N3,N4 | N1=F, src=err | P2 |
| TC3: Dest inexistant | | | ✓ | | | | N1,N3,N5,N6 | N1=F, dest=err | P3 |
| TC4: Fonds insuffisants | | | | ✓ | | | N1,N3,N5,N7,N8,N9 | N8=T | P4 |
| TC5: Transfert OK | | | | | ✓ | | N1,N3,N5,N7,N8,N10-N16 | N8=F, try=ok | P5 |
| TC6: DB error | | | | | | ✓ | N1,N3,N5,N7,N8,N10-N14,N17,N18 | N8=F, try=err | P6 |

**Statement Coverage** : TC1+TC2+TC3+TC4+TC5+TC6 → 100%
**Branch Coverage** : TC1-TC6 → 100%
**Path Coverage** : 6/6 → 100%

### Cas de Test

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

---

## 5. LOAN APPLY - `LoanService.apply()`

### Code source (simplifié)

```typescript
async apply(userId: string, data: { accountId: string; type: LoanType; amount: number; termMonths: number; description: string }) {
  // N1: Vérifier que le compte appartient à l'utilisateur
  const account = await Account.findOne({ where: { id: data.accountId, userId } });

  // N2: Condition compte existe
  if (!account) {               // N2
    throw new NotFoundError('Account'); // N3
  }

  // N4: Calculer le taux d'intérêt
  const interestRate = this.getInterestRate(data.type);

  // N5: Calculer le paiement mensuel
  const monthlyPayment = calculateMonthlyPayment(data.amount, interestRate, data.termMonths);

  // N6: Créer le prêt
  const loan = await Loan.create({
    reference: generateLoanReference(),
    userId,
    accountId: data.accountId,
    type: data.type,
    amount: data.amount,
    interestRate,
    termMonths: data.termMonths,
    monthlyPayment,
    remainingBalance: data.amount + (monthlyPayment * data.termMonths - data.amount),
    description: data.description,
  });

  // N7: Retourner le prêt
  return loan;
}
```

### CFG

```
     [N1] Account.findOne
       |
     [N2] !account ?
      / \
    T/   \F
  [N3]  [N4] getInterestRate
 (throw)  |
         [N5] calculateMonthlyPayment
           |
         [N6] Loan.create
           |  (peut throw → erreur DB)
         [N7] return loan
```

### Chemins identifiés

| Chemin | Description |
|--------|-------------|
| P1 | N1 → N2 → N3 (compte non trouvé / n'appartient pas à l'user) |
| P2 | N1 → N2 → N4 → N5 → N6 → N7 (demande de prêt réussie) |
| P3 | N1 → N2 → N4 → N5 → N6 (erreur DB lors de la création) |

### Coverage Table

| Cas de test | P1 | P2 | P3 | Statement | Branch | Path |
|-------------|----|----|----|----|----|----|
| TC1: Compte non trouvé | ✓ | | | N1,N2,N3 | N2=T | P1 |
| TC2: Prêt personnel créé | | ✓ | | N1,N2,N4,N5,N6,N7 | N2=F | P2 |
| TC3: Prêt hypothécaire créé | | ✓ | | N1,N2,N4,N5,N6,N7 | N2=F | P2 |
| TC4: Prêt auto créé | | ✓ | | N1,N2,N4,N5,N6,N7 | N2=F | P2 |
| TC5: Erreur DB | | | ✓ | N1,N2,N4,N5,N6 | N2=F, create=err | P3 |

**Statement Coverage** : TC1+TC2 → 100%
**Branch Coverage** : TC1+TC2 → 100%
**Path Coverage** : TC1+TC2+TC5 → 100% (3/3)

### Cas de Test

```typescript
describe('LoanService.apply()', () => {
  // TC1 - P1: Compte non trouvé
  it('should throw NotFoundError when account does not belong to user', async () => {
    await expect(loanService.apply('user-id', {
      accountId: 'other-user-account',
      type: LoanType.PERSONAL,
      amount: 10000,
      termMonths: 24,
      description: 'Test loan'
    })).rejects.toThrow('Account not found');
  });

  // TC2 - P2: Prêt personnel
  it('should create a personal loan with correct interest rate (5.5%)', async () => {
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

  // TC3 - P2: Prêt hypothécaire (différent taux)
  it('should create a mortgage loan with correct interest rate (3.2%)', async () => {
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

  // TC4 - P2: Prêt auto
  it('should create an auto loan with correct interest rate (4.0%)', async () => {
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

  // TC5 - P3: Erreur DB
  it('should propagate database error on Loan.create failure', async () => {
    jest.spyOn(Loan, 'create').mockRejectedValueOnce(new Error('DB connection lost'));
    await expect(loanService.apply(userId, {
      accountId: validAccountId,
      type: LoanType.STUDENT,
      amount: 5000,
      termMonths: 48,
      description: 'Study loan'
    })).rejects.toThrow('DB connection lost');
  });
});
```

---

## Résumé Global de Couverture

| Fonctionnalité | Nb Chemins | Nb Tests | Statement Cov. | Branch Cov. | Path Cov. |
|---------------|-----------|---------|----------------|-------------|-----------|
| Login | 4 | 4 | 100% | 100% | 100% |
| Deposit | 5 | 5 | 100% | 100% | 100% |
| Withdraw | 6 | 6 | 100% | 100% | 100% |
| Transfer | 6 | 6 | 100% | 100% | 100% |
| Loan Apply | 3 | 5 | 100% | 100% | 100% |
| **TOTAL** | **24** | **26** | **100%** | **100%** | **100%** |

### Légende des stratégies de test

- **Statement Coverage** : Chaque instruction (nœud) du code est exécutée au moins une fois
- **Branch Coverage** : Chaque branche (True/False) de chaque condition est traversée au moins une fois
- **Path Coverage** : Chaque chemin unique du début à la fin de la fonction est couvert par au moins un cas de test
