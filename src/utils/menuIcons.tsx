import React from 'react';
import {
  ForkKnife, Apple, Banana, Beef, Beer, CakeSlice, Candy, Carrot,
  Cherry, Citrus, Coffee, Cookie, Croissant, CupSoda, Egg, Fish, Grape,
  IceCream, Leaf, Milk, Pizza, Salad, Sandwich, Soup, Wine, Bean, ChefHat,
  EggFried, Ham, Popcorn, Vegan, Wheat,
} from 'lucide-react';

export const foodIcons: { [key: string]: React.ElementType } = {
  ForkKnife, ChefHat, Pizza, Sandwich, Soup, Salad, Beef, Fish,
  Ham, Egg, EggFried, Croissant, Cookie, Popcorn, Bean, Wheat,
  CakeSlice, IceCream, Candy, Apple, Banana, Cherry, Citrus,
  Grape, Carrot, Leaf, Vegan, Coffee, CupSoda, Milk, Beer, Wine,
};

export function MenuIcon({ name, ...props }: { name: string; [key: string]: any }) {
  const IconComponent = foodIcons[name];
  return IconComponent ? <IconComponent {...props} /> : <ForkKnife {...props} />;
}
