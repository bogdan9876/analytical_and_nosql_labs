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

const generateRandomDate = () => {
  const date = faker.date.past(2);
  return {
      date: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear()
  };
};

const generateFakeData = () => {
  const fakeData = [];

  for (let i = 0; i < 10000; i++) {
    const location = getRandomLocation();
    const time = generateRandomDate();

    if (!location) continue;

    const sale = {
      user_id: i + 1,
      user_birth_year: datatype.number({ min: 1960, max: 2005 }),
      user_career: faker.name.jobTitle(),
      user_sex: datatype.boolean() ? 'Male' : 'Female',
      location_city: location.location_city,
      location_region: location.location_region,
      location_country: location.location_country,
      date: time.date,
      month: time.month,
      year: time.year,
      provider_name: faker.random.arrayElement(['AWS', 'Azure', 'GCP']),
      site_type: faker.random.arrayElement(['Blog', 'E-commerce', 'Portfolio', 'Business', 'Personal']),
      site_price: parseFloat(commerce.price(100, 5000, 2)),
      develop_time: datatype.number({ min: 5, max: 180 }),
      marketing_spend: datatype.number({ min: 100, max: 2000 }),
    };

    fakeData.push(sale);
  }

  return fakeData;
};

const fakeData = generateFakeData();

const parser = new Parser();
const csv = parser.parse(fakeData);

fs.writeFileSync('wordpress_data.csv', csv);

console.log('Success.');
