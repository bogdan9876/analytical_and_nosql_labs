import fs from 'fs';
import faker from 'faker';
import { Country, State, City }  from 'country-state-city';
import { Parser } from 'json2csv';
const { commerce, datatype } = faker;

const getRandomLocation = () => {
  const countries = Country.getAllCountries();
  const randomCountry = faker.random.arrayElement(countries);
  
  const states = State.getStatesOfCountry(randomCountry.isoCode);
  if (states.length === 0) return null;

  const randomState = faker.random.arrayElement(states);
  
  const cities = City.getCitiesOfState(randomCountry.isoCode, randomState.isoCode);
  if (cities.length === 0) return null;

  return {
    location_city: cities.length > 0 ? faker.random.arrayElement(cities).name : null,
    location_region: randomState.name,
    location_country: randomCountry.name
  };
};

const generateFakeData = (numRecords) => {
  const fakeData = [];

  for (let i = 0; i < numRecords; i++) {
    const location = getRandomLocation();

    if (!location) continue;

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
      location_city: location.location_city,
      location_region: location.location_region,
      location_country: location.location_country,
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
