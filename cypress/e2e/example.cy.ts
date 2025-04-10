describe('validation', () => {
    test('example page', () => {
        cy.visit('/example');
        cy.get('h1').contains('Example');
    });
});
