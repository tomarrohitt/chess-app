import { GetFriend } from "@/types/friends";

export const STUB_FRIENDS: GetFriend[] = [
  {
    id: "1",
    name: "Arjun Mehta",
    username: "arjunm99",
    rating: 1420,
    wins: 88,
    losses: 44,
    draws: 12,
    image: null,
    createdAt: new Date(),
  },
  {
    id: "2",
    name: "Priya Singh",
    username: "priyaS",
    rating: 1105,
    wins: 34,
    losses: 21,
    draws: 5,
    image: null,
    createdAt: new Date(),
  },
  {
    id: "3",
    name: "Rohit Tomar",
    username: "tomarrohit3240",
    rating: 979,
    wins: 10,
    losses: 28,
    draws: 6,
    image: null,
    createdAt: new Date(),
  },
  {
    id: "4",
    name: "Sneha Verma",
    username: "sneha_v",
    rating: 1680,
    wins: 201,
    losses: 77,
    draws: 33,
    image: null,
    createdAt: new Date(),
  },
];

export const STUB_REQUESTS: GetFriend[] = [
  {
    id: "5",
    name: "Karan Nair",
    username: "knair_chess",
    rating: 1250,
    wins: 55,
    losses: 40,
    draws: 8,
    image: null,
    createdAt: new Date(),
  },
  {
    id: "6",
    name: "Divya Patel",
    username: "div_patel",
    rating: 870,
    wins: 12,
    losses: 18,
    draws: 2,
    image: null,
    createdAt: new Date(),
  },
];

export const STUB_BLOCKED: GetFriend[] = [
  {
    id: "7",
    name: "Toxic GM",
    username: "toxicgm123",
    rating: 2100,
    wins: 500,
    losses: 10,
    draws: 5,
    image: null,
    createdAt: new Date(),
  },
];
