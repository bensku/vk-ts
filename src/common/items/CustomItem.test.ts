import { test } from 'zora';
import { CustomItem } from './CustomItem';
import { Material } from 'org.bukkit';
import { ItemStack } from 'org.bukkit.inventory';
import { Damageable, ItemMeta } from 'org.bukkit.inventory.meta';

const TestItem = new CustomItem({
  type: Material.STICK,
  defaultData: {
    counter: 0,
  },
});

const TestItem2 = new CustomItem({
  type: Material.DIAMOND_PICKAXE,
  damage: 12,
});

const TestItem3 = new CustomItem({
  type: Material.DIRT,
  create(item) {
    return new ItemStack(item.type, 3);
  },

  check() {
    return false;
  },
});

const TestItem4 = new CustomItem({
  type: Material.BEEF,
  defaultData: () => ({
    rand: Math.random(),
  }),
});

const TestItem5 = new CustomItem({
  type: Material.STICK,
  defaultData: {
    first: 0,
    second: 0,
  },
});

test('CustomItems workflow', (t) => {
  const test1 = TestItem.create();
  t.eq(
    test1.type,
    Material.STICK,
    'CustomItem.create() should create an itemstack with the correct type',
  );

  const test2 = TestItem.create({ counter: -1 });
  t.eq(
    TestItem.get(test2)?.counter,
    -1,
    'Calling CustomItem.create() with specified data should create an item with the data',
  );

  const test3 = TestItem5.create({ first: -1 });
  const test3Data = TestItem5.get(test3);
  t.eq(
    { ...test3Data },
    { first: -1, second: 0 },
    'CustomItem.create() with partial data should use default data',
  );

  const invalidItem = new ItemStack(Material.DIRT);
  t.notOk(
    TestItem.get(invalidItem),
    'CustomItem.get() on an invalid item should return undefined',
  );
  t.deepEqual(
    TestItem.get(test1)?.counter,
    0,
    `CustomItem.get() on a just created item should return it's default data`,
  );

  const data = TestItem.get(test1);
  if (data) {
    data.counter = 1;
  }
  t.eq(
    TestItem.get(test1)?.counter,
    1,
    `Mutating object returned by CustomItem.get() should mutate the item's data`,
  );

  try {
    TestItem.set(invalidItem, { counter: 10 });
    t.ok('CustomItem.set() on an invalid item should not throw error');
  } catch (e) {
    t.fail(e);
  }

  TestItem.set(test1, { counter: 5 });
  t.eq(
    TestItem.get(test1)?.counter,
    5,
    'CustomItem.set() with complete data should set the data',
  );

  TestItem.set(test1, (data) => ({ counter: 12 }));
  t.eq(
    TestItem.get(test1)?.counter,
    12,
    `A function supplied to CustomItem.set() should be able to mutate the item's data`,
  );
});

test('CustomItem options', (t) => {
  const item2 = new ItemStack(Material.DIAMOND_PICKAXE);
  const meta = item2.itemMeta as ItemMeta & Damageable;
  meta.damage = 12;
  item2.itemMeta = meta;
  t.ok(
    TestItem2.check(item2),
    'CustomItem.check() should take into account item damage if specified',
  );
  meta.damage = 13;
  item2.itemMeta = meta;
  t.notOk(
    TestItem2.check(item2),
    'CustomItem.check() should fail for items with wrong damage',
  );

  const item = TestItem2.create();
  const meta2 = item.itemMeta as ItemMeta & Damageable;
  t.eq(
    meta2.damage,
    12,
    'Items created with CustomItem.create() should have correct damage',
  );

  const [a, b] = [TestItem4.create(), TestItem4.create()];
  const [dataA, dataB] = [TestItem4.get(a), TestItem4.get(b)];
  t.notEq(
    dataA?.rand,
    dataB?.rand,
    'Passing a function as defaultData should run the function on creation and generate the data',
  );
});

test('CustomItem method overriding', (t) => {
  const item = TestItem3.create();
  t.eq(
    item.type,
    Material.DIRT,
    'CustomItem.create() overload receives the default created itemstack',
  );
  t.eq(
    item.amount,
    3,
    'CustomItem.create() overloading changes the output of CustomItem.create()',
  );

  t.notOk(TestItem3.check(item), 'CustomItem.check() overloading should work');
});
