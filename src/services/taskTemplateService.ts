import type { Task } from '@/models'

export interface TaskTemplate {
  id: string
  category: 'cleaning' | 'homework' | 'chores' | 'personal' | 'pets' | 'outdoor'
  title: string
  description: string
  suggestedFrequency: Task['frequency']
  suggestedPoints: number
  suggestedAllowance?: number
  tags: string[]
}

// Common household task templates
export const taskTemplates: TaskTemplate[] = [
  // Cleaning tasks
  {
    id: 'clean-room',
    category: 'cleaning',
    title: 'Rydde rommet',
    description: 'Rydde og organisere rommet sitt, inkludert å ordne klær og leker',
    suggestedFrequency: 'daily',
    suggestedPoints: 15,
    suggestedAllowance: 5,
    tags: ['rydding', 'organisering', 'rom']
  },
  {
    id: 'make-bed',
    category: 'cleaning',
    title: 'Lage sengen',
    description: 'Lage sengen sin pen og ordentlig hver morgen',
    suggestedFrequency: 'daily',
    suggestedPoints: 5,
    tags: ['morgenrutine', 'soverom']
  },
  {
    id: 'vacuum-room',
    category: 'cleaning',
    title: 'Støvsuge rommet',
    description: 'Støvsuge gulvet i rommet sitt grundig',
    suggestedFrequency: 'weekly',
    suggestedPoints: 20,
    suggestedAllowance: 10,
    tags: ['støvsuging', 'gulv', 'rengjøring']
  },
  {
    id: 'clean-bathroom',
    category: 'cleaning',
    title: 'Rengjøre badet',
    description: 'Tørke av servant, speil og oppsamle håndklær',
    suggestedFrequency: 'weekly',
    suggestedPoints: 25,
    suggestedAllowance: 15,
    tags: ['bad', 'rengjøring', 'tørking']
  },
  {
    id: 'dust-furniture',
    category: 'cleaning',
    title: 'Støve møbler',
    description: 'Støve av møbler og hyller i stua eller eget rom',
    suggestedFrequency: 'weekly',
    suggestedPoints: 15,
    suggestedAllowance: 8,
    tags: ['støving', 'møbler', 'hyller']
  },

  // Homework and study
  {
    id: 'daily-homework',
    category: 'homework',
    title: 'Gjøre lekser',
    description: 'Fullføre alle skolelekser for dagen',
    suggestedFrequency: 'daily',
    suggestedPoints: 25,
    tags: ['skole', 'lekser', 'læring']
  },
  {
    id: 'reading-practice',
    category: 'homework',
    title: 'Lesetrening',
    description: 'Lese høyt eller stille i 20 minutter',
    suggestedFrequency: 'daily',
    suggestedPoints: 15,
    tags: ['lesing', 'trening', 'utdanning']
  },
  {
    id: 'study-review',
    category: 'homework',
    title: 'Repetere ukens pensum',
    description: 'Gå gjennom og repetere det som ble lært denne uken',
    suggestedFrequency: 'weekly',
    suggestedPoints: 30,
    suggestedAllowance: 20,
    tags: ['repetisjon', 'læring', 'skole']
  },

  // Kitchen and cooking
  {
    id: 'set-table',
    category: 'chores',
    title: 'Dekke bordet',
    description: 'Dekke bordet til middag med tallerkener, bestikk og glass',
    suggestedFrequency: 'daily',
    suggestedPoints: 10,
    tags: ['kjøkken', 'måltid', 'hjelp']
  },
  {
    id: 'clear-table',
    category: 'chores',
    title: 'Rydde av bordet',
    description: 'Rydde av bordet etter måltid og sette oppvasken til side',
    suggestedFrequency: 'daily',
    suggestedPoints: 10,
    tags: ['kjøkken', 'måltid', 'rydding']
  },
  {
    id: 'load-dishwasher',
    category: 'chores',
    title: 'Fylle oppvaskmaskin',
    description: 'Sette ren oppvask inn i oppvaskmaskinen og starte den',
    suggestedFrequency: 'daily',
    suggestedPoints: 15,
    suggestedAllowance: 5,
    tags: ['oppvask', 'kjøkken', 'maskin']
  },
  {
    id: 'empty-dishwasher',
    category: 'chores',
    title: 'Tømme oppvaskmaskin',
    description: 'Ta ut ren oppvask og sette på plass i skaper',
    suggestedFrequency: 'daily',
    suggestedPoints: 15,
    suggestedAllowance: 5,
    tags: ['oppvask', 'kjøkken', 'organisering']
  },
  {
    id: 'help-cooking',
    category: 'chores',
    title: 'Hjelpe til med middag',
    description: 'Hjelpe til med forberedelse eller tilberedning av middag',
    suggestedFrequency: 'daily',
    suggestedPoints: 20,
    suggestedAllowance: 10,
    tags: ['matlaging', 'hjelp', 'kjøkken']
  },

  // Laundry and clothes
  {
    id: 'sort-laundry',
    category: 'chores',
    title: 'Sortere klesvask',
    description: 'Sortere skitne klær i riktige vaskeposer',
    suggestedFrequency: 'weekly',
    suggestedPoints: 10,
    tags: ['klesvask', 'sortering', 'organisering']
  },
  {
    id: 'fold-laundry',
    category: 'chores',
    title: 'Brette tøy',
    description: 'Brette sine egne klær og legge dem i skapet',
    suggestedFrequency: 'weekly',
    suggestedPoints: 20,
    suggestedAllowance: 10,
    tags: ['klesvask', 'bretting', 'organisering']
  },

  // Trash and recycling
  {
    id: 'empty-trash',
    category: 'chores',
    title: 'Tømme søppel',
    description: 'Tømme søppelkasser og sette ut nye poser',
    suggestedFrequency: 'weekly',
    suggestedPoints: 15,
    suggestedAllowance: 8,
    tags: ['søppel', 'renholdm', 'ansvar']
  },
  {
    id: 'recycling',
    category: 'chores',
    title: 'Kildesortering',
    description: 'Sortere resirkulerbart avfall i riktige beholdere',
    suggestedFrequency: 'weekly',
    suggestedPoints: 15,
    tags: ['kildesortering', 'miljø', 'ansvar']
  },

  // Personal care
  {
    id: 'brush-teeth',
    category: 'personal',
    title: 'Pusse tenner',
    description: 'Pusse tenner grundig morgen og kveld',
    suggestedFrequency: 'daily',
    suggestedPoints: 5,
    tags: ['hygiene', 'tenner', 'dagligrutine']
  },
  {
    id: 'shower',
    category: 'personal',
    title: 'Dusje',
    description: 'Ta dusj og vaske seg grundig',
    suggestedFrequency: 'daily',
    suggestedPoints: 10,
    tags: ['hygiene', 'dusj', 'rengjøring']
  },
  {
    id: 'organize-backpack',
    category: 'personal',
    title: 'Organisere skolesekken',
    description: 'Pakke og organisere skolesekken for neste dag',
    suggestedFrequency: 'daily',
    suggestedPoints: 10,
    tags: ['skole', 'organisering', 'forberedelse']
  },

  // Pet care
  {
    id: 'feed-pet',
    category: 'pets',
    title: 'Mate kjæledyr',
    description: 'Gi kjæledyret mat og friskt vann',
    suggestedFrequency: 'daily',
    suggestedPoints: 15,
    suggestedAllowance: 5,
    tags: ['kjæledyr', 'fôring', 'ansvar']
  },
  {
    id: 'walk-dog',
    category: 'pets',
    title: 'Lufte hunden',
    description: 'Ta med hunden på tur og sørge for at den får mosjon',
    suggestedFrequency: 'daily',
    suggestedPoints: 25,
    suggestedAllowance: 15,
    tags: ['hund', 'lufting', 'mosjon']
  },
  {
    id: 'clean-pet-area',
    category: 'pets',
    title: 'Rengjøre kjæledyrets område',
    description: 'Rengjøre kjæledyrets seng, leker eller bur',
    suggestedFrequency: 'weekly',
    suggestedPoints: 20,
    suggestedAllowance: 10,
    tags: ['kjæledyr', 'rengjøring', 'hygiene']
  },

  // Outdoor tasks
  {
    id: 'water-plants',
    category: 'outdoor',
    title: 'Vanne planter',
    description: 'Vanne blomster og planter inne eller ute',
    suggestedFrequency: 'daily',
    suggestedPoints: 10,
    tags: ['planter', 'vanning', 'hage']
  },
  {
    id: 'rake-leaves',
    category: 'outdoor',
    title: 'Rake løv',
    description: 'Rake sammen løv i hagen på høsten',
    suggestedFrequency: 'weekly',
    suggestedPoints: 25,
    suggestedAllowance: 15,
    tags: ['hage', 'høst', 'raking']
  },
  {
    id: 'shovel-snow',
    category: 'outdoor',
    title: 'Måke snø',
    description: 'Måke snø fra innkjørselen eller gangveien',
    suggestedFrequency: 'weekly',
    suggestedPoints: 30,
    suggestedAllowance: 20,
    tags: ['snø', 'vinter', 'måking']
  }
]

class TaskTemplateService {
  getTemplates(): TaskTemplate[] {
    return taskTemplates
  }

  getTemplatesByCategory(category: TaskTemplate['category']): TaskTemplate[] {
    return taskTemplates.filter(template => template.category === category)
  }

  getTemplate(id: string): TaskTemplate | undefined {
    return taskTemplates.find(template => template.id === id)
  }

  getCategories(): TaskTemplate['category'][] {
    return ['cleaning', 'homework', 'chores', 'personal', 'pets', 'outdoor']
  }

  getCategoryLabel(category: TaskTemplate['category']): string {
    const labels = {
      cleaning: 'Rengjøring',
      homework: 'Lekser & Læring',
      chores: 'Husarbeid',
      personal: 'Personlig stell',
      pets: 'Kjæledyr',
      outdoor: 'Utendørs'
    }
    return labels[category]
  }

  searchTemplates(query: string): TaskTemplate[] {
    const lowercaseQuery = query.toLowerCase()
    return taskTemplates.filter(template =>
      template.title.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  }

  createTaskFromTemplate(template: TaskTemplate, familyId: string, assignedTo: string, createdBy: string): Omit<Task, 'id'> {
    return {
      familyId,
      title: template.title,
      description: template.description,
      assignedTo,
      frequency: template.suggestedFrequency,
      points: template.suggestedPoints,
      allowanceAmount: template.suggestedAllowance,
      allowanceEnabled: !!template.suggestedAllowance,
      isActive: true,
      createdBy,
      createdAt: new Date()
    }
  }
}

export const taskTemplateService = new TaskTemplateService()