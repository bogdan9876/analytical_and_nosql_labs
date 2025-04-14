import fs from 'fs';
import faker from 'faker';
import { Country, State, City } from 'country-state-city';
import { Parser } from 'json2csv';
import moment from 'moment';

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
  const date = moment(faker.date.past(2));
  return {
    date: date.format('YYYY-MM-DD')
  };
};

const generateCommonSiteAttributes = (count) => {
  const attributes = [];

  for (let i = 0; i < count; i++) {
    attributes.push({
      site_price: parseFloat(commerce.price(15, 200, 2)),
      develop_time: datatype.number({ min: 5, max: 180 }),
      marketing_spend: datatype.number({ min: 100, max: 2000 }),
    });
  }

  return attributes;
};

const generateUsersWithLocations = (count) => {
  const users = [];

  for (let i = 0; i < count; i++) {
    const location = getRandomLocation();
    if (!location) continue;

    const user = {
      user_birth_year: datatype.number({ min: 1960, max: 2005 }),
      user_career: faker.name.jobType(),
      user_sex: datatype.boolean() ? 'Male' : 'Female',
      location_city: location.location_city,
      location_region: location.location_region,
      location_country: location.location_country
    };

    users.push(user);
  }

  return users;
};

const generateFakeData = () => {
  const uniqueUsers = generateUsersWithLocations(4000);
  const commonAttributes = generateCommonSiteAttributes(250);
  const fakeData = [];

  uniqueUsers.forEach((user) => {
    const repeatCount = datatype.number({ min: 1, max: 4 });

    for (let i = 0; i < repeatCount; i++) {
      const time = generateRandomDate();
      const siteAttributes = faker.random.arrayElement(commonAttributes);

      const sale = {
        ...user,
        date: time.date,
        provider_name: faker.random.arrayElement(['AWS', 'Azure', 'GCP']),
        site_type: faker.random.arrayElement(['Blog', 'E-commerce', 'Portfolio', 'Business', 'Personal']),
        site_price: siteAttributes.site_price,
        develop_time: siteAttributes.develop_time,
        marketing_spend: siteAttributes.marketing_spend,
      };

      fakeData.push(sale);
    }
  });

  return fakeData;
};

const fakeData = generateFakeData();

const parser = new Parser();
const csv = parser.parse(fakeData);

fs.writeFileSync('wordpress_data.csv', csv);

console.log('Success.');
