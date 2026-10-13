declare module 'swagger-jsdoc' {
  interface Options {
    definition: Record<string, any>;
    apis: string[];
  }
  function swaggerJsdoc(options: Options): any;
  export default swaggerJsdoc;
}
