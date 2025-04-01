USE `lab2nosql`;

ALTER TABLE `lab2nosql`.`dim_date` 
ADD PRIMARY KEY (`id`);

ALTER TABLE `lab2nosql`.`dim_hosting` 
ADD PRIMARY KEY (`id`);

ALTER TABLE `lab2nosql`.`dim_location` 
ADD PRIMARY KEY (`id`);

ALTER TABLE `lab2nosql`.`dim_site` 
ADD PRIMARY KEY (`id`);

ALTER TABLE `lab2nosql`.`dim_user` 
ADD PRIMARY KEY (`id`);

ALTER TABLE `lab2nosql`.`facts` 
ADD PRIMARY KEY (`id`);

ALTER TABLE `lab2nosql`.`facts` 
ADD CONSTRAINT `date_fk`
  FOREIGN KEY (`date_id`)
  REFERENCES `lab2nosql`.`dim_date` (`id`);

ALTER TABLE `lab2nosql`.`facts`
ADD CONSTRAINT `hosting_fk`
  FOREIGN KEY (`hosting_id`)
  REFERENCES `lab2nosql`.`dim_hosting` (`id`);

ALTER TABLE `lab2nosql`.`facts` 
ADD CONSTRAINT `location_fk`
  FOREIGN KEY (`location_id`)
  REFERENCES `lab2nosql`.`dim_location` (`id`);
  
ALTER TABLE `lab2nosql`.`facts` 
ADD CONSTRAINT `site_fk`
  FOREIGN KEY (`site_id`)
  REFERENCES `lab2nosql`.`dim_site` (`id`);

ALTER TABLE `lab2nosql`.`facts` 
ADD CONSTRAINT `user_fk`
  FOREIGN KEY (`user_id`)
  REFERENCES `lab2nosql`.`dim_user` (`id`);
