
define('First level', () => {
  define('failing', () => {
    beforeEach(() => console.log('be - also nooo!!'));
    afterEach(() => console.log('ae - nooooO!!!'));
    beforeAll(() => {console.log('ba -- no -- THROW'); throw new Error("shit")} );
    afterAll(() => console.log('aa ==============NO!!!==============='));
    it('should not exist', () => Promise.resolve(1));
    it('should not exist 2', () => Promise.reject(new Error('Nothing works')));
  });
  define('second', () => {
    beforeEach(() => console.log('be 2'));
    afterEach(() => console.log('ae 2'));
    beforeAll(() => console.log('ba ============================='));
    afterAll(() => console.log('aa ============================='));
    it('should work', () => Promise.resolve(1));
    it('should fail', () => Promise.reject(new Error('Nothing works')));
  });
  it('should work', () => Promise.resolve(1));
  it('should fail', () => Promise.reject());
  beforeEach(() => console.log('be'));
  afterEach(() => console.log('ae'));
  beforeAll(() => console.log('ba'));
  afterAll(() => console.log('aa'));
});
