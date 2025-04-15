import { faker } from '@faker-js/faker';

interface FieldConfig {
    readonly name: string;
    readonly type: string;
    readonly required: boolean;
    readonly min?: number;
    readonly max?: number;
}

interface GenerateDataOptions {
    readonly fields: FieldConfig[];
    readonly count: number;
};

export const generateData = (options: GenerateDataOptions) => {
    const { fields, count } = options;
    
    return Array.from({ length: count }, () => {
        const item: Record<string, any> = {};
        
        fields.forEach((field) => {
            // Skip non-required fields sometimes
            if (!field.required && Math.random() > 0.8) {
                return;
            }
            
            // Generate value based on field type
            switch (field.type.toLowerCase()) {
                case 'string':
                    item[field.name] = faker.lorem.word();
                    break;
                case 'paragraph':
                    item[field.name] = faker.lorem.paragraph();
                    break;
                case 'name':
                    item[field.name] = faker.person.fullName();
                    break;
                case 'firstname':
                    item[field.name] = faker.person.firstName();
                    break;
                case 'lastname':
                    item[field.name] = faker.person.lastName();
                    break;
                case 'email':
                    item[field.name] = faker.internet.email();
                    break;
                case 'phone':
                    item[field.name] = faker.phone.number();
                    break;
                case 'number':
                    item[field.name] = faker.number.int({
                        min: field.min ?? 0,
                        max: field.max ?? 100
                    });
                    break;
                case 'boolean':
                    item[field.name] = faker.datatype.boolean();
                    break;
                case 'date':
                    item[field.name] = faker.date.past();
                    break;
                case 'address':
                    item[field.name] = faker.location.streetAddress();
                    break;
                case 'city':
                    item[field.name] = faker.location.city();
                    break;
                case 'country':
                    item[field.name] = faker.location.country();
                    break;
                case 'zipcode':
                    item[field.name] = faker.location.zipCode();
                    break;
                case 'uuid':
                    item[field.name] = faker.string.uuid();
                    break;
                case 'avatar':
                    item[field.name] = faker.image.avatar();
                    break;
                    
                default:
                    item[field.name] = faker.lorem.word();
            }
        });
        
        return item;
    });
};

