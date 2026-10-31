import { NextResponse } from "next/server"
import type { ArtistProfile } from "@/lib/types"

const mockArtistData: ArtistProfile = {
  artist: {
    id: "1",
    name: "Алексей Смирнов",
    title: "Тату-мастер, Художник",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    rating: 4.9,
    reviewsCount: 120,
    location: "Москва",
    metro: "м. Бауманская",
    about: "Более 10 лет опыта, специализируюсь на реализме и графике. В своей работе использую только качественные материалы и индивидуальный подход к каждому клиенту. Специализируюсь на эскизах и графике.",
    tags: ["Реализм", "Графика", "Блэкворк", "Цветная тату"],
    badges: [
      { icon: "verified", label: "Проверенный мастер" },
      { icon: "fast", label: "Быстрый ответ" },
      { icon: "works", label: "Более 500 работ" }
    ]
  },
  services: [
    {
      id: "1",
      icon: "pencil",
      title: "Разработка эскиза",
      description: "Индивидуальный подход",
      price: "от 3000 ₽"
    },
    {
      id: "2", 
      icon: "clock",
      title: "Сеанс тату (3 часа)",
      description: "Стерильные материалы",
      price: "15000 ₽"
    },
    {
      id: "3",
      icon: "refresh",
      title: "Перекрытие/Коррекция",
      description: "Сложные случаи",
      price: "по договоренности"
    }
  ],
  portfolio: [
    { id: "1", imageUrl: "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=400&h=600&fit=crop", title: "Реализм", height: "large" },
    { id: "2", imageUrl: "https://images.unsplash.com/photo-1590246815117-0ec27ac9bc95?w=400&h=500&fit=crop", title: "Графика", height: "medium" },
    { id: "3", imageUrl: "https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=400&h=300&fit=crop", title: "Минимализм", height: "small" },
    { id: "4", imageUrl: "https://images.unsplash.com/photo-1562962230-16e4623d36e6?w=400&h=350&fit=crop", title: "Блэкворк", height: "small" },
    { id: "5", imageUrl: "https://images.unsplash.com/photo-1475180429745-21de9a24a9fb?w=400&h=550&fit=crop", title: "Портрет", height: "large" },
    { id: "6", imageUrl: "https://images.unsplash.com/photo-1578926288207-a90a5366759d?w=400&h=400&fit=crop", title: "Геометрия", height: "medium" },
    { id: "7", imageUrl: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=400&h=450&fit=crop", title: "Цветная", height: "medium" },
    { id: "8", imageUrl: "https://images.unsplash.com/photo-1565058379802-bbe93b2f703a?w=400&h=380&fit=crop", title: "Абстракция", height: "small" },
    { id: "9", imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=520&fit=crop", title: "Природа", height: "large" },
    { id: "10", imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=320&fit=crop", title: "Животные", height: "small" },
    { id: "11", imageUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=480&fit=crop", title: "Акварель", height: "medium" },
    { id: "12", imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=550&fit=crop", title: "Искусство", height: "large" }
  ],
  reviews: [
    {
      id: "1",
      author: "Алексей Смирнов",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      rating: 4.9,
      date: "16.05.2017",
      text: "Отличный мастер, сделал всё быстро и качественно!"
    },
    {
      id: "2",
      author: "Летиция Валава",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      rating: 4.9,
      date: "16.08.2017",
      text: "Очень довольна результатом, эскиз просто супер."
    }
  ]
}

export async function GET() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // In real app, fetch from database based on id
  return NextResponse.json(mockArtistData)
}
