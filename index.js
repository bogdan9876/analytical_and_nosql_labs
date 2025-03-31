import fs from 'fs';
import faker from 'faker';
import { Parser } from 'json2csv';
const { commerce, datatype } = faker;

const generateFakeData = (numRecords) => {
  const fakeData = [];

  for (let i = 0; i < numRecords; i++) {
    const sale = {
      id: i + 1,
      site_price: parseFloat(commerce.price(500, 10000, 2)),
      develop_time: datatype.number({ min: 5, max: 180 }),
      marketing_spend: datatype.number({ min: 100, max: 5000 }),
      location_id: datatype.number({ min: 1, max: 50 }),
      user_id: i + 1,
      site_id: datatype.number({ min: 1, max: 10 }),
      method_id: datatype.number({ min: 1, max: 5 }),
      time_id: datatype.number({ min: 1, max: 365 }),
      user_birth_year: datatype.number({ min: 1960, max: 2005 }),
      user_career: faker.name.jobTitle(),
      user_sex: datatype.boolean() ? 'Male' : 'Female',
      location_city: faker.address.city(),
      location_region: faker.address.state(),
      location_country: faker.address.country(),
      action_date: faker.date.past(2).toISOString().split('T')[0],
      provider_name: faker.company.companyName(),
      site_type: faker.random.arrayElement(['Blog', 'E-commerce', 'Portfolio', 'Business', 'Personal'])
    };

    fakeData.push(sale);
  }

  return fakeData;
};

const fakeData = generateFakeData(100);

const parser = new Parser();
const csv = parser.parse(fakeData);

fs.writeFileSync('sales_data.csv', csv);

console.log('CSV файл успішно згенеровано!');
