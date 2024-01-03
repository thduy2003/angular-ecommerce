import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Country } from 'src/app/common/country';
import { FormValidators } from 'src/app/common/form-validators';
import { Order } from 'src/app/common/order';
import { OrderItem } from 'src/app/common/order-item';
import { PaymentInfo } from 'src/app/common/payment-info';
import { Purchase } from 'src/app/common/purchase';
import { State } from 'src/app/common/state';
import { CartService } from 'src/app/services/cart.service';
import { CheckoutService } from 'src/app/services/checkout.service';
import { ShopFormService } from 'src/app/services/shop-form.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent implements OnInit {
  checkoutFormGroup!: FormGroup;
  totalPrice: number = 0;
  totalQuantity: number = 0;

  creditCardYears: number[] = [];
  creditCardMonths: number[] = [];

  countries: Country[] = [];

  shippingAddressStates: State[] = [];
  billingAddressStates: State[] = [];

  storage: Storage = sessionStorage;

  //initialize Stripe API
  stripe = Stripe(environment.stripePublishableKey);

  paymentInfo: PaymentInfo = new PaymentInfo();

  cardElement: any;
  displayError: any = '';

  isDisabled: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private shopFormService: ShopFormService,
    private cartService: CartService,
    private checkoutService: CheckoutService,
    private router: Router,
  ) {}
  getStates(formGroupName: string) {
    const formGroup = this.checkoutFormGroup?.get(formGroupName);
    const countryCode = formGroup?.value.country.code;
    this.shopFormService.getStates(countryCode).subscribe((data) => {
      if (formGroupName === 'shippingAddress') {
        this.shippingAddressStates = data;
      } else {
        this.billingAddressStates = data;
      }
      //select first item by default
      formGroup?.get('state')?.setValue(data[0]);
    });
  }
  ngOnInit(): void {
    //setup Stripe payment form
    this.reviewCartDetail();

    const theEmail = JSON.parse(this.storage?.getItem('userEmail')!);
    this.checkoutFormGroup = this.formBuilder.group({
      customer: this.formBuilder.group({
        firstName: new FormControl('', [
          Validators.required,
          Validators.minLength(2),
          FormValidators.notOnlyWhitespace,
        ]),
        lastName: new FormControl('', [
          Validators.required,
          Validators.minLength(2),
          FormValidators.notOnlyWhitespace,
        ]),
        email: new FormControl(theEmail, [
          Validators.required,
          Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$'),
        ]),
      }),
      shippingAddress: this.formBuilder.group({
        street: new FormControl('', [
          Validators.required,
          Validators.minLength(2),
          FormValidators.notOnlyWhitespace,
        ]),
        city: new FormControl('', [
          Validators.required,
          Validators.minLength(2),
          FormValidators.notOnlyWhitespace,
        ]),
        state: new FormControl('', [Validators.required]),
        country: new FormControl('', [Validators.required]),
        zipCode: new FormControl('', [
          Validators.required,
          Validators.minLength(2),
          FormValidators.notOnlyWhitespace,
        ]),
      }),
      billingAddress: this.formBuilder.group({
        street: new FormControl('', [
          Validators.required,
          Validators.minLength(2),
          FormValidators.notOnlyWhitespace,
        ]),
        city: new FormControl('', [
          Validators.required,
          Validators.minLength(2),
          FormValidators.notOnlyWhitespace,
        ]),
        state: new FormControl('', [Validators.required]),
        country: new FormControl('', [Validators.required]),
        zipCode: new FormControl('', [
          Validators.required,
          Validators.minLength(2),
          FormValidators.notOnlyWhitespace,
        ]),
      }),
    });
    this.setupStripePaymentForm();
    //populate credit card months
    // const startMonth: number = new Date().getMonth() + 1;

    // this.shopFormService.getCreditCardMonths(startMonth).subscribe((data) => {
    //   this.creditCardMonths = data;
    // });
    // //populate credit card year
    // this.shopFormService.getCreditCardYears().subscribe((data) => {
    //   this.creditCardYears = data;
    // });
    this.shopFormService.getCountries().subscribe((data) => {
      this.countries = data;
    });
  }

  setupStripePaymentForm() {
    // get a handle to stripe elements
    var elements = this.stripe.elements();

    // create a card element ... and hide the zip-code field
    this.cardElement = elements.create('card', { hidePostalCode: true });
    // add an instance of card UI component into the 'card-element' div
    this.cardElement.mount('#card-element');
    // add event biinding for the 'change' evenett on the card element
    this.cardElement.on('change', (event: any) => {
      //get a handle to card-errors element
      this.displayError = document.getElementById('card-errors');
      if (event.complete) {
        this.displayError.textContent = '';
      } else if (event.error) {
        //show validation error to customer
        this.displayError.textContent = event.error.message;
      }
    });
  }

  reviewCartDetail() {
    this.cartService.totalPrice.subscribe((data) => (this.totalPrice = data));
    this.cartService.totalQuantity.subscribe(
      (data) => (this.totalQuantity = data),
    );
  }
  get firstName() {
    return this.checkoutFormGroup?.get('customer.firstName');
  }
  get lastName() {
    return this.checkoutFormGroup?.get('customer.lastName');
  }
  get email() {
    return this.checkoutFormGroup?.get('customer.email');
  }
  get shippingAddressCity() {
    return this.checkoutFormGroup?.get('shippingAddress.city');
  }

  get shippingAddressStreet() {
    return this.checkoutFormGroup?.get('shippingAddress.street');
  }
  get shippingAddressState() {
    return this.checkoutFormGroup?.get('shippingAddress.state');
  }
  get shippingAddressCountry() {
    return this.checkoutFormGroup?.get('shippingAddress.country');
  }
  get shippingAddressZipCode() {
    return this.checkoutFormGroup?.get('shippingAddress.zipCode');
  }
  get billingAddressCity() {
    return this.checkoutFormGroup?.get('billingAddress.city');
  }

  get billingAddressStreet() {
    return this.checkoutFormGroup?.get('billingAddress.street');
  }
  get billingAddressState() {
    return this.checkoutFormGroup?.get('billingAddress.state');
  }
  get billingAddressCountry() {
    return this.checkoutFormGroup?.get('billingAddress.country');
  }
  get billingAddressZipCode() {
    return this.checkoutFormGroup?.get('billingAddress.zipCode');
  }
  // get creditCardType() {
  //   return this.checkoutFormGroup.get('creditCard.cardType');
  // }
  // get creditNameOnCard() {
  //   return this.checkoutFormGroup.get('creditCard.nameOnCard');
  // }
  // get creditCardNumber() {
  //   return this.checkoutFormGroup.get('creditCard.cardNumber');
  // }
  // get creditSecurityCode() {
  //   return this.checkoutFormGroup.get('creditCard.securityCode');
  // }

  // handleMonthsAndYears() {
  //   const creditCardFormGroup = this.checkoutFormGroup?.get('creditCard');
  //   const currentYear: number = new Date().getFullYear();
  //   const selectedYear: number = Number(
  //     creditCardFormGroup?.value.expirationYear,
  //   );
  //   //if the current   year equals the selected year, the start with current months
  //   let startMonth: number;
  //   if (currentYear === selectedYear) {
  //     startMonth = new Date().getMonth() + 1;
  //   } else {
  //     startMonth = 1;
  //   }
  //   this.shopFormService
  //     .getCreditCardMonths(startMonth)
  //     .subscribe((data) => (this.creditCardMonths = data));
  // }
  copyShippingAddressToBillingAddress(event: any) {
    if (event.target.checked) {
      this.checkoutFormGroup?.controls['billingAddress'].setValue(
        this.checkoutFormGroup?.controls['shippingAddress'].value,
      );
      this.billingAddressStates = this.shippingAddressStates;
    } else {
      this.checkoutFormGroup?.controls['billingAddress'].reset();
      this.billingAddressStates = [];
    }
  }
  onSubmit() {
    console.log('Handle submit form');
    console.log(this.checkoutFormGroup?.get('customer')!.value);
    if (this.checkoutFormGroup?.invalid) {
      console.log('sđssd');
      this.checkoutFormGroup?.markAllAsTouched();
      return;
    }
    //set up order
    let order = new Order();
    order.totalPrice = this.totalPrice;
    order.totalQuantity = this.totalQuantity;

    //get cart items
    const cartItems = this.cartService.cartItems;

    //create orderItems from cartItems
    const orderItems: OrderItem[] = cartItems.map(
      (tempCartItem) => new OrderItem(tempCartItem),
    );

    //set up purchase
    let purchase = new Purchase();

    //populate purchase - customer
    purchase.customer = this.checkoutFormGroup?.controls['customer'].value;

    //populate purchase - shipping address
    purchase.shippingAddress =
      this.checkoutFormGroup?.controls['shippingAddress'].value;
    const shippingState: State = JSON.parse(
      JSON.stringify(purchase.shippingAddress.state),
    );
    const shippingCountry: Country = JSON.parse(
      JSON.stringify(purchase.shippingAddress.country),
    );
    purchase.shippingAddress.state = shippingState.name;
    purchase.shippingAddress.country = shippingCountry.name;

    //populate purchase - billing address
    purchase.billingAddress =
      this.checkoutFormGroup?.controls['shippingAddress'].value;
    const billingState: State = JSON.parse(
      JSON.stringify(purchase.billingAddress.state),
    );
    const billingCountry: Country = JSON.parse(
      JSON.stringify(purchase.billingAddress.country),
    );
    purchase.billingAddress.state = billingState.name;
    purchase.billingAddress.country = billingCountry.name;

    //populate purchase - order and orderItems
    purchase.order = order;
    purchase.orderItems = orderItems;

    //compute payment info
    this.paymentInfo.amount = Math.round(this.totalPrice * 100);
    this.paymentInfo.currency = 'USD';
    this.paymentInfo.receiptEmail = purchase.customer.email;

    //if valiid form then
    // - create payment intent
    // -confirm card payment
    // - place order
    if (
      !this.checkoutFormGroup?.invalid &&
      this.displayError.textContent === ''
    ) {
      this.isDisabled = true;
      this.checkoutService
        .createPaymentIntent(this.paymentInfo)
        .subscribe((paymentIntentResponse) => {
          this.stripe
            .confirmCardPayment(
              paymentIntentResponse.client_secret,
              {
                payment_method: {
                  card: this.cardElement,
                  billing_details: {
                    email: purchase.customer.email,
                    // name: `${purchase.customer.firstName} ${purchase.customer.lastName}`,
                    address: {
                      line1: purchase.billingAddress.street,
                      city: purchase.billingAddress.city,
                      state: purchase.billingAddress.state,
                      postal_code: purchase.billingAddress.zipCode,
                      // country: this.billingAddressCity?.value.name,
                    },
                  },
                },
              },
              { handleActions: false },
            )
            .then((result: any) => {
              if (result.error) {
                // inform the customer there was an error
                alert(`There was an error: ${result.error.message}`);
                this.isDisabled = false;
              } else {
                //call REST API via the CheckoutService
                this.checkoutService.placeOrder(purchase).subscribe({
                  next: (response: any) => {
                    alert(
                      `Your order has been receiveed. \n Order tracking number: ${response.orderTrackingNumber}`,
                    );
                    //reset cart
                    this.resetCart();
                    this.isDisabled = false;
                  },
                  error: (err: any) => {
                    alert(`There was an error: ${err.message}`);
                    this.isDisabled = false;
                  },
                });
              }
            });
        });
    } else {
      this.checkoutFormGroup?.markAllAsTouched();
      return;
    }
  }
  resetCart() {
    //reset cart data
    this.cartService.cartItems = [];
    this.cartService.totalPrice.next(0);
    this.cartService.totalQuantity.next(0);
    this.cartService.persistCartItems();
    //reset the form
    this.checkoutFormGroup?.reset();

    //navigate back to the products page
    this.router.navigateByUrl('/products');
  }
}
