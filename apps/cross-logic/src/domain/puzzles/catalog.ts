import type { PuzzleDefinition } from '../types';

export const BUILTIN_PUZZLES: PuzzleDefinition[] = [
  {
    id: 'puzzle-terrace-gathering',
    title: 'La Reunión en la Terraza',
    difficulty: 'easy',
    story: 'Tres amigos se juntaron en la terraza un domingo por la tarde con sus respectivas mascotas y bebidas.',
    author: 'builtin',
    categories: [
      {
        id: 'friends',
        name: 'Amigos',
        items: [
          { id: 'ana', name: 'Ana' },
          { id: 'bruno', name: 'Bruno' },
          { id: 'clara', name: 'Clara' },
        ],
      },
      {
        id: 'pets',
        name: 'Mascotas',
        items: [
          { id: 'perro', name: 'Perro' },
          { id: 'gato', name: 'Gato' },
          { id: 'loro', name: 'Loro' },
        ],
      },
      {
        id: 'drinks',
        name: 'Bebidas',
        items: [
          { id: 'cafe', name: 'Café' },
          { id: 'te', name: 'Té' },
          { id: 'limonada', name: 'Limonada' },
        ],
      },
    ],
    clues: [
      { id: 'c1', text: 'Ana toma café caliente, pero no tiene perro.' },
      { id: 'c2', text: 'El dueño del perro toma limonada fresca.' },
      { id: 'c3', text: 'Bruno no tiene loro ni toma té.' },
      { id: 'c4', text: 'La persona con el gato no es Clara.' },
    ],
    solutionTuples: [
      { friends: 'ana', pets: 'gato', drinks: 'cafe' },
      { friends: 'bruno', pets: 'perro', drinks: 'limonada' },
      { friends: 'clara', pets: 'loro', drinks: 'te' },
    ],
  },
  {
    id: 'puzzle-museum-enigma',
    title: 'El Enigma del Museo',
    difficulty: 'easy',
    story: 'Tres investigadores buscan tres reliquias perdidas en tres salas distintas del museo arqueológico.',
    author: 'builtin',
    categories: [
      {
        id: 'investigators',
        name: 'Investigadores',
        items: [
          { id: 'diego', name: 'Diego' },
          { id: 'elena', name: 'Elena' },
          { id: 'fabio', name: 'Fabio' },
        ],
      },
      {
        id: 'relics',
        name: 'Reliquias',
        items: [
          { id: 'corona', name: 'Corona' },
          { id: 'cetro', name: 'Cetro' },
          { id: 'amuleto', name: 'Amuleto' },
        ],
      },
      {
        id: 'rooms',
        name: 'Salas',
        items: [
          { id: 'sala_norte', name: 'Sala Norte' },
          { id: 'sala_este', name: 'Sala Este' },
          { id: 'sala_sur', name: 'Sala Sur' },
        ],
      },
    ],
    clues: [
      { id: 'c1', text: 'Elena está investigando en la Sala Norte.' },
      { id: 'c2', text: 'La Corona dorada se encuentra en la Sala Este.' },
      { id: 'c3', text: 'Diego no está buscando el Cetro ni el Amuleto.' },
      { id: 'c4', text: 'Fabio no está en la Sala Norte.' },
      { id: 'c5', text: 'Quien busca el Amuleto no está en la Sala Sur.' },
    ],
    solutionTuples: [
      { investigators: 'diego', relics: 'corona', rooms: 'sala_este' },
      { investigators: 'elena', relics: 'amuleto', rooms: 'sala_norte' },
      { investigators: 'fabio', relics: 'cetro', rooms: 'sala_sur' },
    ],
  },
  {
    id: 'puzzle-tournament-champions',
    title: 'Torneo de Campeones',
    difficulty: 'medium',
    story: 'Cuatro campeones compiten en cuatro disciplinas representando a cuatro ciudades del mundo.',
    author: 'builtin',
    categories: [
      {
        id: 'players',
        name: 'Jugadores',
        items: [
          { id: 'mateo', name: 'Mateo' },
          { id: 'lucia', name: 'Lucía' },
          { id: 'tomas', name: 'Tomás' },
          { id: 'valeria', name: 'Valeria' },
        ],
      },
      {
        id: 'games',
        name: 'Juegos',
        items: [
          { id: 'ajedrez', name: 'Ajedrez' },
          { id: 'go', name: 'Go' },
          { id: 'damas', name: 'Damas' },
          { id: 'shogi', name: 'Shogi' },
        ],
      },
      {
        id: 'cities',
        name: 'Ciudades',
        items: [
          { id: 'madrid', name: 'Madrid' },
          { id: 'kioto', name: 'Kioto' },
          { id: 'londres', name: 'Londres' },
          { id: 'berlin', name: 'Berlín' },
        ],
      },
    ],
    clues: [
      { id: 'c1', text: 'El jugador de Kioto es maestro de Go.' },
      { id: 'c2', text: 'Tomás representa a Londres, pero no juega al Ajedrez ni al Shogi.' },
      { id: 'c3', text: 'Mateo juega al Ajedrez.' },
      { id: 'c4', text: 'Lucía es quien representa a Kioto.' },
      { id: 'c5', text: 'El jugador de Damas no es de Berlín ni de Madrid.' },
      { id: 'c6', text: 'Valeria no juega al Ajedrez ni es de Madrid.' },
    ],
    solutionTuples: [
      { players: 'mateo', games: 'ajedrez', cities: 'madrid' },
      { players: 'lucia', games: 'go', cities: 'kioto' },
      { players: 'tomas', games: 'damas', cities: 'londres' },
      { players: 'valeria', games: 'shogi', cities: 'berlin' },
    ],
  },
  {
    id: 'puzzle-mansion-mystery',
    title: 'La Mansión Misteriosa',
    difficulty: 'hard',
    story: 'Cuatro invitados en una misteriosa cena ocuparon cuatro habitaciones distintas con trajes de colores diferentes y objetos únicos.',
    author: 'builtin',
    categories: [
      {
        id: 'guests',
        name: 'Invitados',
        items: [
          { id: 'arthur', name: 'Arthur' },
          { id: 'beatrice', name: 'Beatrice' },
          { id: 'charles', name: 'Charles' },
          { id: 'diana', name: 'Diana' },
        ],
      },
      {
        id: 'rooms',
        name: 'Habitaciones',
        items: [
          { id: 'biblioteca', name: 'Biblioteca' },
          { id: 'invernadero', name: 'Invernadero' },
          { id: 'observatorio', name: 'Observatorio' },
          { id: 'galeria', name: 'Galería' },
        ],
      },
      {
        id: 'colors',
        name: 'Trajes',
        items: [
          { id: 'azul', name: 'Azul' },
          { id: 'verde', name: 'Verde' },
          { id: 'dorado', name: 'Dorado' },
          { id: 'rojo', name: 'Rojo' },
        ],
      },
      {
        id: 'objects',
        name: 'Objetos',
        items: [
          { id: 'pluma', name: 'Pluma' },
          { id: 'reloj', name: 'Reloj' },
          { id: 'brujula', name: 'Brújula' },
          { id: 'llave', name: 'Llave' },
        ],
      },
    ],
    clues: [
      { id: 'c1', text: 'Arthur estuvo en la Biblioteca con su elegante traje azul.' },
      { id: 'c2', text: 'Quien llevó el reloj estuvo en el Invernadero con traje verde.' },
      { id: 'c3', text: 'Beatrice es quien tiene el reloj de bolsillo.' },
      { id: 'c4', text: 'Diana no visitó el Observatorio y su traje era rojo.' },
      { id: 'c5', text: 'En la Galería se encontraba la persona con la llave misteriosa.' },
      { id: 'c6', text: 'Charles visitó el Observatorio vistiendo su traje dorado.' },
      { id: 'c7', text: 'Arthur no llevaba la brújula ni el reloj.' },
    ],
    solutionTuples: [
      { guests: 'arthur', rooms: 'biblioteca', colors: 'azul', objects: 'pluma' },
      { guests: 'beatrice', rooms: 'invernadero', colors: 'verde', objects: 'reloj' },
      { guests: 'charles', rooms: 'observatorio', colors: 'dorado', objects: 'brujula' },
      { guests: 'diana', rooms: 'galeria', colors: 'rojo', objects: 'llave' },
    ],
  },
];
