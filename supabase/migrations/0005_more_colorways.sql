-- ============================================================================
-- Hijabisaura — 0005: a fuller dye card
--
-- Adds 34 more colourways, taking the card from 22 to 56.
--
-- Additive on purpose. Unlike 0003 this touches ONLY the colorways table, so it
-- is safe to run at any time — it cannot disturb products, stock, or the images
-- you have uploaded.
--
-- Codes are never reused, so the new ones continue the sequence rather than
-- filling gaps. A code printed on a tag has to keep meaning the same colour.
--
-- Safe to run more than once.
-- ============================================================================

insert into public.colorways (code, name, hex, family, is_light, sort_order) values
  ('HA-01', 'Midnight Plum', '#2A1F33', 'purple', false, 0),
  ('HA-02', 'Ink Rose', '#7A2F45', 'red', false, 1),
  ('HA-03', 'Aura Rose', '#B98D86', 'pink', true, 2),
  ('HA-04', 'Jade Deep', '#1F6B5C', 'green', false, 3),
  ('HA-05', 'Sage Mist', '#A8B5A2', 'green', true, 4),
  ('HA-06', 'Oat Chalk', '#E4DED3', 'neutral', true, 5),
  ('HA-07', 'Sand Dune', '#C9B79C', 'neutral', true, 6),
  ('HA-08', 'Camel', '#B08A5E', 'brown', true, 7),
  ('HA-09', 'Saffron', '#D8A03D', 'yellow', true, 8),
  ('HA-10', 'Terracotta', '#B4593A', 'orange', false, 9),
  ('HA-11', 'Bordeaux', '#6E2231', 'red', false, 10),
  ('HA-12', 'Blush Pearl', '#E7C8C4', 'pink', true, 11),
  ('HA-13', 'Lavender Haze', '#B3A5C6', 'purple', true, 12),
  ('HA-14', 'Steel Blue', '#5B7290', 'blue', false, 13),
  ('HA-15', 'Navy Ink', '#23314C', 'blue', false, 14),
  ('HA-16', 'Teal Slate', '#3A6B72', 'blue', false, 15),
  ('HA-17', 'Olive Bronze', '#6E6A3C', 'green', false, 16),
  ('HA-18', 'Charcoal', '#3B3A3E', 'neutral', false, 17),
  ('HA-19', 'Pearl White', '#EFEDEA', 'neutral', true, 18),
  ('HA-20', 'Onyx', '#1A181C', 'neutral', false, 19),
  ('HA-21', 'Mocha', '#6B4A3C', 'brown', false, 20),
  ('HA-22', 'Rose Gold', '#D9A99A', 'pink', true, 21),
  ('HA-23', 'Almond Milk', '#EDE3D6', 'neutral', true, 22),
  ('HA-24', 'Warm Taupe', '#A8968A', 'neutral', true, 23),
  ('HA-25', 'Stone Grey', '#9A9A96', 'neutral', true, 24),
  ('HA-26', 'Graphite', '#4A4A50', 'neutral', false, 25),
  ('HA-27', 'Dusty Peach', '#E0AF97', 'orange', true, 26),
  ('HA-28', 'Apricot', '#E5A76B', 'orange', true, 27),
  ('HA-29', 'Brick', '#9C4B33', 'orange', false, 28),
  ('HA-30', 'Rust', '#8E4A28', 'orange', false, 29),
  ('HA-31', 'Mulberry', '#5C2B44', 'purple', false, 30),
  ('HA-32', 'Aubergine', '#42283F', 'purple', false, 31),
  ('HA-33', 'Dusty Mauve', '#A98BA0', 'purple', true, 32),
  ('HA-34', 'Wisteria', '#8E7BA8', 'purple', true, 33),
  ('HA-35', 'Powder Blue', '#A9BFCF', 'blue', true, 34),
  ('HA-36', 'Denim', '#4A6484', 'blue', false, 35),
  ('HA-37', 'Petrol', '#274A55', 'blue', false, 36),
  ('HA-38', 'Midnight Navy', '#1B2439', 'blue', false, 37),
  ('HA-39', 'Seafoam', '#B4CFC4', 'green', true, 38),
  ('HA-40', 'Pistachio', '#C2CE9E', 'green', true, 39),
  ('HA-41', 'Fern', '#4F6B44', 'green', false, 40),
  ('HA-42', 'Forest', '#2A4034', 'green', false, 41),
  ('HA-43', 'Emerald', '#1C5E4A', 'green', false, 42),
  ('HA-44', 'Champagne', '#E3D2B0', 'yellow', true, 43),
  ('HA-45', 'Mustard', '#C08F2C', 'yellow', false, 44),
  ('HA-46', 'Antique Gold', '#A5822F', 'yellow', false, 45),
  ('HA-47', 'Cherry', '#8E2231', 'red', false, 46),
  ('HA-48', 'Maroon', '#5A1A24', 'red', false, 47),
  ('HA-49', 'Watermelon', '#C4566B', 'red', false, 48),
  ('HA-50', 'Cocoa', '#4A342A', 'brown', false, 49),
  ('HA-51', 'Toffee', '#8A6242', 'brown', false, 50),
  ('HA-52', 'Chai', '#B08F72', 'brown', true, 51),
  ('HA-53', 'Ivory', '#F4EFE4', 'neutral', true, 52),
  ('HA-54', 'Jet', '#111013', 'neutral', false, 53),
  ('HA-55', 'Fuchsia', '#A83A6E', 'pink', false, 54),
  ('HA-56', 'Candy Pink', '#DE8FAC', 'pink', true, 55)
on conflict (code) do update set
  name = excluded.name, hex = excluded.hex,
  family = excluded.family, is_light = excluded.is_light,
  sort_order = excluded.sort_order;
