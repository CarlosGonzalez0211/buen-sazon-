-- Starter categories. Edit freely; codes are what reports group by.
INSERT INTO expense_categories (code, name, kind) VALUES
  ('food_produce',  'Frutas y verduras',      'cogs'),
  ('food_meat',     'Carnes',                 'cogs'),
  ('food_dairy',    'Lácteos y huevo',        'cogs'),
  ('food_grocery',  'Abarrotes',              'cogs'),
  ('food_tortilla', 'Tortilla y pan',         'cogs'),
  ('beverages',     'Bebidas',                'cogs'),
  ('disposables',   'Desechables y empaques', 'opex'),
  ('cleaning',      'Limpieza',               'opex'),
  ('gas_lp',        'Gas LP',                 'opex'),
  ('fuel',          'Gasolina',               'opex'),
  ('utilities',     'Luz, agua, internet',    'opex'),
  ('rent',          'Renta',                  'opex'),
  ('payroll',       'Nómina',                 'payroll'),
  ('maintenance',   'Mantenimiento',          'opex'),
  ('equipment',     'Equipo',                 'capex'),
  ('marketing',     'Marketing',              'opex'),
  ('taxes_fees',    'Impuestos y comisiones', 'tax'),
  ('mall_fee',      'Mantenimiento de plaza', 'opex'),
  ('accounting',    'Contadora',              'opex'),
  ('insurance',     'Seguros',                'opex'),
  ('other',         'Otros',                  'other')
ON CONFLICT (code) DO NOTHING;
