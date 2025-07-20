/**
 * Функция для расчета выручки
 * @param purchase запись о покупке (это одна из записей в поле items из чека в data.purchase_records)
 * @param _product карточка товара (это продукт из коллекции data.products)
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const { discount, sale_price, quantity } = purchase;
  return sale_price * quantity * (1 - discount / 100);
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  const { profit } = seller;

  if (index === 0) {
    return +(profit * 0.15);
  } else if (index === 1 || index === 2) {
    return +(profit * 0.10);
  } else if (index === total - 1) {
    return 0;
  } else {
    return +(profit * 0.05);
  }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  if (
    !data ||
    !Array.isArray(data.sellers) ||
    !Array.isArray(data.purchase_records) ||
    !Array.isArray(data.products) ||
    data.sellers.length === 0 ||
    data.purchase_records.length === 0 ||
    data.products.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  }

  // @TODO: Проверка наличия опций
  const { calculateRevenue, calculateBonus } = options;
  if (!calculateRevenue || !calculateBonus) {
    throw new Error("Не хватает функций");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа
  const sellerIndex = Object.fromEntries(
    sellerStats.map((item) => [item.id, item])
  );
  const productIndex = Object.fromEntries(
    data.products.map((item) => [item.sku, item])
  );

  // @TODO: Расчет выручки и прибыли для каждого продавца

  data.purchase_records.forEach((record) => {
    // Чек
    const seller = sellerIndex[record.seller_id]; // Продавец
    seller.sales_count++;
    seller.revenue += record.total_amount;
    // Увеличить количество продаж
    // Увеличить общую сумму всех продаж

    // Расчёт прибыли для каждого товара
    record.items.forEach((item) => {
      const product = productIndex[item.sku]; // Товар
      // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
      const cost = product.purchase_price * item.quantity;
      // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
      const revenue = calculateSimpleRevenue(item);
      // Посчитать прибыль: выручка минус себестоимость
      const profit = revenue - cost;
      // Увеличить общую накопленную прибыль (profit) у продавца
      seller.profit += profit;

      // Учёт количества проданных товаров
      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += item.quantity;
      // По артикулу товара увеличить его проданное количество у продавца
    });
  });

  // @TODO: Сортировка продавцов по прибыли

  sellerStats.sort((a, b) => {
    if (a.profit < b.profit) {
      return 1;
    }
    if (a.profit > b.profit) {
      return -1;
    }
    return 0;
  });

  // @TODO: Назначение премий на основе ранжирования
  sellerStats.forEach((seller, index) => {
    const total = sellerStats.length;
    seller.bonus = calculateBonusByProfit(index, total, seller);

    const sortedProducts = Object.entries(seller.products_sold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    seller.top_products = sortedProducts.map(([sku, quantity]) => ({
      sku,
      quantity,
    }));
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями

  return sellerStats.map((seller) => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2),
  }));
}

// ############# ТУТ Я ТЕСТИРУЮ ОТДЕЛЬНЫЕ КУСОЧКИ ###################

// {
//         id: seller.id,
//         name: `${seller.first_name} ${seller.last_name}`,
//         revenue: 0,
//         profit: 0,
//         sales_count: 0,
//         products_sold: {}
// }

// const sellerStats = data.sellers.map(seller => ({
//         id: seller.id,
//         name: `${seller.first_name} ${seller.last_name}`,
//         revenue: 0,
//         profit: 0,
//         sales_count: 0,
//         products_sold: {}
// }));

// console.log('*** Изначальные данные продавцов ***',sellerStats);

// const sellerIndex = Object.fromEntries(sellerStats.map(item => [item.id, item]));
// const productIndex = Object.fromEntries(data.products.map(item => [item.sku, item]));

//     data.purchase_records.forEach(record => {
//         const seller = sellerIndex[record.seller_id];
//         seller.sales_count ++;
//         seller.revenue += record.total_amount;

//            record.items.forEach(item => {
//             const product = productIndex[item.sku];
//             const cost = product.purchase_price * item.quantity;
//             const revenue = calculateSimpleRevenue(item);
//             const profit = revenue - cost;
//             seller.profit += profit;

//             if (!seller.products_sold[item.sku]) {
//                 seller.products_sold[item.sku] = 0;
//             }   seller.products_sold[item.sku] ++;
//            })

//         })

//         sellerStats.sort((a, b) => {
//     if (a.profit < b.profit) {
//         return 1;
//     }
//     if (a.profit > b.profit) {
//         return -1;
//     }
//     return 0;
// })

// sellerStats.forEach((seller, index) => {
//         const total = sellerStats.length;
//         seller.bonus = calculateBonusByProfit(index, total, seller);
//                       const sortedProducts = Object.entries(seller.products_sold)
//         .sort((a, b) => b[1] - a[1])
//         .slice(0, 10);

//         seller.top_products = sortedProducts.map(([sku, quantity]) => ({ sku, quantity }));
// });

// console.log(sellerIndex);
// console.log(productIndex);
