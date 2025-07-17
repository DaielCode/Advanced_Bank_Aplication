'use strict';

// const { captureOwnerStack } = require('react');

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// BANKIST APP
const movements = [200, 450, -400, 3000, -650, -130, 70, 1300];

// console.log(movements.findLastIndex(mov => mov > 1000));
// Data
const account1 = {
  owner: 'Jonas Schmedtmann',
  movements: [200, 450, -400, 3000, -650, -130, 70, 1300],
  interestRate: 1.2, // %
  pin: 1111,
  type: 'premium',
};

const account2 = {
  owner: 'Jessica Davis',
  movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
  interestRate: 1.5,
  pin: 2222,
  type: 'standard',
};

const account3 = {
  owner: 'Steven Thomas Williams',
  movements: [200, -200, 340, -300, -20, 50, 400, -460],
  interestRate: 0.7,
  pin: 3333,
  type: 'premium',
};

const account4 = {
  owner: 'Sarah Smith',
  movements: [430, 1000, 700, 50, 90],
  interestRate: 1,
  pin: 4444,
  type: 'basic',
};

const accounts = [account1, account2, account3, account4];
// Elements
const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelSumInterest = document.querySelector('.summary__value--interest');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');

const btnLogin = document.querySelector('.login__btn');
const btnTransfer = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');

const inputLoginUsername = document.querySelector('.login__input--user');
const inputLoginPin = document.querySelector('.login__input--pin');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');

const btnRegister = document.querySelector('.register-btn'); // кнопка реєстрації
const inputRegisterOwner = document.getElementById('register-username');
const inputRegisterPin = document.getElementById('register-password');
const inputRegisterType = null; // або можна прибрати цю змінну

const login = async function (e) {
  e.preventDefault();

  const username = inputLoginUsername.value;
  const pin = Number(inputLoginPin.value);

  try {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, pin }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login failed');

    // Зберігаємо поточного користувача
    currentAccount = data;

    // Оновлюємо UI
    updateUI(currentAccount);
    containerApp.style.opacity = 100;
    labelWelcome.textContent = `Welcome back, ${
      currentAccount.owner.split(' ')[0]
    }`;
  } catch (err) {
    console.error('Login error:', err.message);
  }
};

const register = async function (e) {
  e.preventDefault();

  const owner = inputRegisterName.value;
  const username = inputRegisterUsername.value;
  const pin = Number(inputRegisterPin.value);

  try {
    const response = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, username, pin }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Registration failed');

    // Автоматично логінимо
    currentAccount = data;
    updateUI(currentAccount);
    containerApp.style.opacity = 100;
    labelWelcome.textContent = `Welcome, ${currentAccount.owner.split(' ')[0]}`;
  } catch (err) {
    console.error('Registration error:', err.message);
  }
};

btnRegister.addEventListener('click', function (e) {
  e.preventDefault();

  const owner = inputRegisterOwner.value.trim();
  const pin = Number(inputRegisterPin.value);
  const type = inputRegisterType ? inputRegisterType.value.trim() : 'basic';

  if (!owner || !pin || pin.toString().length !== 4) {
    alert("Будь ласка, введіть ім'я та 4-значний PIN");
    return;
  }

  // Створення нового акаунта
  const newAccount = {
    owner: owner,
    movements: [],
    interestRate: 1, // можна зробити статично
    pin: pin,
    type: type,
  };

  // Створюємо username для нового акаунта (перші літери імені)
  newAccount.username = owner
    .toLowerCase()
    .split(' ')
    .map(name => name[0])
    .join('');

  accounts.push(newAccount);

  // Оновити інтерфейс, якщо хочеш показати новий акаунт або логін
  alert('Реєстрація успішна! Тепер можна увійти.');

  // Очистити поля
  inputRegisterOwner.value = inputRegisterPin.value = '';
  if (inputRegisterType) inputRegisterType.value = '';

  // Можеш викликати updateUI(newAccount); якщо хочеш одразу показати акаунт
});
const showRegisterBtn = document.getElementById('show-register');
const registerModal = document.getElementById('register-modal');
const closeRegisterBtn = document.getElementById('close-register');

showRegisterBtn.addEventListener('click', () => {
  registerModal.classList.remove('hidden');
});

closeRegisterBtn.addEventListener('click', () => {
  registerModal.classList.add('hidden');
});

// Щоб закривати модалку при кліку поза формою
registerModal.addEventListener('click', e => {
  if (e.target === registerModal) {
    registerModal.classList.add('hidden');
  }
});

// Реєстрація
const registerForm = document.getElementById('register-form');
const registerMessage = document.getElementById('register-message');

registerForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  const username = document.getElementById('register-username').value;
  const password = document.getElementById('register-password').value;

  try {
    const res = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    registerMessage.textContent = data.message;
    registerMessage.style.color = res.ok ? 'green' : 'red';
  } catch (err) {
    registerMessage.textContent = 'Помилка зʼєднання з сервером';
    registerMessage.style.color = 'red';
  }
});

// Логін
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');

loginForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    loginMessage.textContent = data.message;
    loginMessage.style.color = res.ok ? 'green' : 'red';

    if (res.ok && data.token) {
      localStorage.setItem('token', data.token);
      console.log('Token:', data.token);
    }
  } catch (err) {
    loginMessage.textContent = 'Помилка зʼєднання з сервером';
    loginMessage.style.color = 'red';
  }
});

if (res.ok && data.token) {
  localStorage.setItem('token', data.token);

  const accRes = await fetch('http://localhost:3000/account', {
    headers: {
      Authorization: `Bearer ${data.token}`,
    },
  });
  const account = await accRes.json();
  updateUI(account);
  containerApp.style.opacity = 100;
}

const displayMovements = function (movements, sort = false) {
  containerMovements.innerHTML = ''; //HTMLcode

  const movs = sort ? movements.slice().sort((a, b) => a - b) : movements;

  movs.forEach(function (mov, i) {
    const type = mov > 0 ? 'deposit' : 'withdrawal';
    const html = `    
      <div class="movements__row">
        <div class="movements__type movements__type--${type}">${
      i + 1
    }${type}</div>
          <div class="movements__value">${mov}€</div>
      </div>`;

    containerMovements.insertAdjacentHTML('afterbegin', html); //де ми вставимо, код html для цього
  });
};

// displayMovements(account1.movements);

const calcDisplaySummary = function (acc) {
  const incomes = acc.movements
    .filter(mov => mov > 0)
    .reduce((acc, mov) => acc + mov, 0);
  labelSumIn.textContent = `${incomes}€`;

  const out = acc.movements
    .filter(mov => mov < 0)
    .reduce((acc, mov) => acc + mov, 0);
  labelSumOut.textContent = `${Math.abs(out)}€`;

  const interest = acc.movements
    .filter(mov => mov > 0)
    .map(deposit => (deposit * acc.interestRate) / 100)
    .filter(int => {
      return int >= 1;
    })
    .reduce((acc, int) => acc + int, 0);
  labelSumInterest.textContent = `${interest}€`;
};

const res = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
});
const data = await res.json();
currentAccount = data.user;
updateUI(currentAccount);

// calcDisplaySummary(account1.movements);

btnLoan.addEventListener('click', function (e) {
  e.preventDefault();
  const amount = Number(inputLoanAmount.value);

  if (amount > 0 && CurrentAccount.movements.some(mov => mov >= amount * 0.1)) {
    CurrentAccount.movements.push(amount);

    updateUI(CurrentAccount);
  }
  inputLoanAmount.value = '';
});

const createUsernames = function (accs) {
  accs.forEach(function (acc) {
    acc.username = acc.owner
      .toLowerCase()
      .split(' ')
      .map(name => name[0])
      .join('');
  });
};

const updateUI = function (acc) {
  displayMovements(acc.movements);
  calcDisplayPrintBalance(acc);
  calcDisplaySummary(acc);
};

createUsernames(accounts);

let CurrentAccount;

btnLogin.addEventListener('click', function (e) {
  e.preventDefault();

  CurrentAccount = accounts.find(
    acc => acc.username === inputLoginUsername.value
  );

  if (CurrentAccount?.pin === Number(inputLoginPin.value)) {
    labelWelcome.textContent = `Welcome back, ${
      CurrentAccount.owner.split(' ')[0]
    }`;
    containerApp.style.opacity = 100;
    inputLoginPin.value = inputLoginUsername.value = '';
    inputLoginPin.blur();
    updateUI(CurrentAccount);
  }
});

const calcDisplayPrintBalance = function (acc) {
  acc.balance = acc.movements.reduce((acc, mov) => acc + mov, 0);

  labelBalance.textContent = `${acc.balance}€`;
};

// calcDisplayPrintBalance(account1.movements);

const deposits = movements.filter(function (mov) {
  return mov > 0;
});

const depositFor = [];
for (const mov of movements) if (mov > 0) depositFor.push(mov);

const withdrawals = movements.filter(mov => mov < 0); ////////===============

//буде перша буква кожного слова

btnTransfer.addEventListener('click', function (e) {
  e.preventDefault();
  const amount = Number(inputTransferAmount.value);
  const receiverAcc = accounts.find(
    acc => acc.username === inputTransferTo.value
  );

  inputTransferAmount.value = inputTransferTo.value = '';

  if (
    amount > 0 &&
    receiverAcc.username !== CurrentAccount.username &&
    receiverAcc &&
    CurrentAccount.balance >= amount
  ) {
    CurrentAccount.movements.push(-amount);
    receiverAcc.movements.push(amount);
    updateUI(CurrentAccount);
  }
});

btnClose.addEventListener('click', function (e) {
  e.preventDefault();
  if (
    Number(inputClosePin.value) === CurrentAccount.pin &&
    inputCloseUsername.value === CurrentAccount.username
  ) {
    const index = accounts.findIndex(
      acc => acc.username === CurrentAccount.username
    );

    accounts.splice(index, 1);
    containerApp.style.opacity = 0;
    inputClosePin.value = inputCloseUsername.value = '';
  }
});

let sorted = false;

btnSort.addEventListener('click', function (e) {
  e.preventDefault();
  sorted = !sorted;
  displayMovements(CurrentAccount.movements, sorted);
});

const grupedMovements = Object.groupBy(movements, movement =>
  movement > 0 ? 'deposit' : 'withdrawals'
);
console.log(grupedMovements);

const grupedByActive = Object.groupBy(accounts, account => {
  const movss = account.movements.length;
  if (movss >= 8) return 'very active';
  if (movss >= 4) return 'active';
  if (movss >= 1) return 'moderate';
  return 'inactive';
});

const groupedAccounts = Object.groupBy(accounts, ({ type }) => type);

const AllDeposits = accounts
  .map(acc => acc.movements)
  .flat()
  .filter(mov => mov > 0)
  .reduce((sum, curr) => sum + curr, 0);
console.log(AllDeposits);

//2.
const AllDepositsOne = accounts
  .map(acc => acc.movements)
  .flat()
  .reduce((count, cur) => (cur >= 1000 ? count++ : count), 0);
console.log(AllDepositsOne);

//3.

const sums = accounts
  .flatMap(acc => acc.movements)
  .reduce(
    (sums, cur) => {
      // cur > 0 ? (sums.deposits += cur) : (sums.withdrawals += cur);
      // return sums;
      sums[cur > 0 ? 'deposits' : 'withdrawals'] += cur;
      return sums;
    },
    { deposits: 0, withdrawals: 0 }
  );

console.log(sums);

const capitalize = function (title) {
  const capitalizeUp = str => str[0].toUpperCase() + str.slice(1);
  const exceptions = ['a', 'and', 'an', 'but', 'the', 'in'];
  const titlecase = title
    .toLowerCase()
    .split(' ')
    .map(word => (exceptions.includes(word) ? word : capitalizeUp(word)))
    .join(' ');

  return titlecase;
};

console.log(capitalize('this is a nice title'));
console.log(capitalize('this is a LONG title but not too long'));
console.log(capitalize('and here is another title with an EXAMPLE'));

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// LECTURES

/////////////////////////////////////////////////

// let arr = ['a', 'b', 'c', 'd', 'e'];

// //return new array, from c

// console.log(arr.slice(2));
// //виеде позиції 2, 3
// console.log(arr.slice(2, 4));
// //два останні елементи
// console.log(arr.slice(-2));
// console.log(arr.slice(1, -2));
// console.log(arr.slice()); //буде копія
// console.log([...arr]); //копія

// //SPLICE ============= змінює оріг масив
// console.log(arr.splice(2));
// arr.splice(-1); //++++++++++++ останій елемент видалиться
// console.log(arr);
// arr.splice(1, 2); //видалить 2 і 3 елемент

// //REVERSE

// arr = ['a', 'b', 'c', 'd', 'e'];
// const arr2 = ['j', 'i', 'h', 'g', 'f'];
// console.log(arr2.reverse()); // змінює оригінальний масив
// console.log(arr2);

// //CONCAT METHOD ======оригінал не змінює
// const letters = arr.concat(arr2);
// console.log(letters);

// //JOIN

// console.log(letters.join(' - ')); //випише весь масив, між елементами буде цей знак

const arr = [23, 11, 64];
// console.log(arr.at(0)); //те саме, що вивести елемент  з позиції

// console.log(arr.at(-1)); // легке виведення останнього елементу
//==================працює також із рядками

// for (const movement of movements) {
//   if (movement > 0) {
//     console.log(`You deposited ${movement}`);
//   } else {
//     console.log(`You withdrew ${Math.abs(movement)}`);
//   }
// }
// console.log(`---------FOREACH------------`);
// movements.forEach(function (movement, i, arr) {
//   if (movement > 0) {
//     console.log(`Movement ${i + 1} You deposited ${movement}`);
//   } else {
//     console.log(`Movement ${i + 1}You withdrew ${Math.abs(movement)}`);
//   }
// });
//=============не можна вткористати break continue
//0: function(200)

// const currencies = new Map([
//   ['USD', 'United States dollar'],
//   ['EUR', 'Euro'],
//   ['GBP', 'Pound sterling'],
// ]);

// currencies.forEach(function (value, key, map) {
//   console.log(`${key}: ${value}`);
// });

// //SET
// const currenciesUNIQUE = new Set(['USD', 'GBP', 'USD', 'EUR', 'EUR']);
// console.log(currenciesUNIQUE);
// currenciesUNIQUE.forEach(function (value, key, map) {});

const eurToUsd = 1.1;

const movementsUSD = movements.map(mov => mov * eurToUsd);

const movementsUSDfor = [];
for (const mov of movements) {
  movementsUSDfor.push(mov * eurToUsd);
}

const movementsDesc = movements.map(
  (mov, i) =>
    `Movement ${i + 1}You ${mov > 0 ? 'deposited' : 'withdrew'} ${Math.abs(
      mov
    )}`
);

//ACC -> SNOWBALL
const balance = movements.reduce((acc, curr) => acc + curr, 0);
// 0 - з якого числа почнеться додавання

//MAXIMUM VALUE

const max = movements.reduce((acc, mov) => {
  if (acc > mov) {
    return acc;
  } else {
    return mov;
  }
}, movements[0]);

console.log(max);
const totalDepUSD = movements
  .filter(mov => mov > 0)
  .map(mov => mov * eurToUsd)
  .reduce((acc, mov) => acc + mov, 0);

movements.find(mov => mov < 0); //перший елемент, який задовільняє цю умову
