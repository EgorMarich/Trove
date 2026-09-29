// .eslintrc.js
module.exports = {
  root: true,
  overrides: [
    {
      files: ['apps/frontend/**/*.{vue,ts,js}'],
      extends: ['./apps/frontend/.eslintrc.js'],
    },
    {
      files: ['apps/backend/**/*.ts'],
      extends: ['./apps/backend/.eslintrc.js'],
    },
  ],
}